import {
  PublicationImagesLengths,
  type Comment,
  type Outfit,
  type PostReactions,
  type Publication,
  type Reactions,
  type User,
  type UUID,
} from '$lib/types';
import { getEnv } from '../utils';
import { unlink, writeFile } from 'node:fs/promises';
import { UserDAO } from './user';
import { OutfitDAO } from './outfit';
import { ReactionDAO } from './reaction';
import { filterText } from '../socialFilter';
import { DateUtils } from '$lib/utils';
import { CommentDAO } from './comment';
import { sql } from 'bun';

export interface PublicationTable {
  id: UUID;
  user_id: UUID;
  description: string;
  created_at: Date;
  outfit_id?: UUID;
}
export interface PublicationImageTable {
  id: UUID;
  publication_id: UUID;
}

export class PublicationDAO {
  static convertToPublication(
    row: PublicationTable,
    {
      user,
      reactions,
      outfit,
      userReaction,
      images,
      comments,
    }: {
      user: User;
      reactions: PostReactions;
      outfit?: Outfit | undefined;
      userReaction?: Reactions;
      images: string[];
      comments?: Comment[];
    }
  ): Publication {
    return {
      id: row.id,
      images: (images.length > 0 ? images : ['NOT_FOUND']).map(
        (image) => `${getEnv('ORIGIN', 'http://localhost:5173')}/assets/publication/${image}.png`
      ),
      user,
      description: row.description,
      createdAt: new Date(row.created_at),
      outfit,
      reactions,
      userReaction,
      comments: comments ?? [],
    };
  }

  static async create(
    userId: UUID,
    imagesBuffers: Buffer[],
    description: string,
    todaysOutfit: boolean
  ): Promise<Publication> {
    const outfitId = await OutfitDAO.getTodaysOutfitIdForUser(userId, todaysOutfit);
    const rows = await sql<
      PublicationTable[]
    >`INSERT INTO publication (user_id, description, outfit_id) VALUES (${userId}, ${filterText(description)}, ${outfitId}) RETURNING *`;
    if (rows.length === 0) {
      throw new Error('Failed to create publication');
    }

    const post = await this.getPublicationById(rows[0].id);
    if (!post) {
      throw new Error('Failed to retrieve created publication');
    }
    for (const imageBuffer of imagesBuffers.slice(0, PublicationImagesLengths.max)) {
      const insertRows =
        await sql`INSERT INTO publication_image (publication_id) VALUES (${post.id}) RETURNING *`;
      const row = insertRows[0];
      await this.writePostImage(row.id, imageBuffer);
    }

    return post;
  }

  static async getPublicationById(
    id: Publication['id'],
    userId?: User['id']
  ): Promise<Publication | null> {
    const rows = await sql<PublicationTable[]>`SELECT * FROM publication WHERE id = ${id}`;

    if (rows.length === 0) {
      return null;
    }

    const item = rows[0];
    const user = await UserDAO.getUserById(item.user_id);
    const outfit = (await OutfitDAO.getOutfitById(item.outfit_id as UUID)) ?? undefined;
    const reactions = await ReactionDAO.getReactionsForPost(item.id);
    let userReaction: null | Reactions = null;
    if (userId) userReaction = await ReactionDAO.getUserReaction(item.id, userId);
    const images = await this.getPostImages(item.id);
    const comments = await CommentDAO.getCommentsForPost(item.id);
    const post = PublicationDAO.convertToPublication(item, {
      user,
      outfit,
      reactions,
      images,
      comments,
      userReaction: userReaction ?? undefined,
    });
    return post;
  }

  static async getPublicationByUserId(
    userId: UUID,
    limit: number,
    offset: number
  ): Promise<Publication[]> {
    const rows = await sql<
      PublicationTable[]
    >`SELECT * FROM publication WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    if (rows.length === 0) {
      return [];
    }

    return await PublicationDAO.publicationTableToPublicationArray(rows);
  }

  static async getFollowedFeed(
    userId: User['id'],
    limit: number,
    seenPostIds: UUID[] = []
  ): Promise<Publication[]> {
    // Only return posts from users followed by the given user
    // Build the NOT IN clause and parameter list dynamically to avoid
    // passing the literal string 'NULL' to a UUID parameter.
    let params: Array<UUID | number> = [userId];
    let notInClause = '';
    if (seenPostIds.length > 0) {
      const placeholders = seenPostIds.map((_, i) => `$${i + 2}`).join(', ');
      notInClause = `AND p.id NOT IN (${placeholders})`;
      params = params.concat(seenPostIds);
    }
    // limit is the last parameter
    params.push(limit);

    const limitPlaceholder = `$${params.length}`;
    const rows = await sql.unsafe<PublicationTable[]>(
      `SELECT p.*
       FROM publication p
       JOIN followers f ON f.following_id = p.user_id
       WHERE f.follower_id = $1
       ${notInClause}
       ORDER BY p.created_at DESC
       LIMIT ${limitPlaceholder}`,
      params
    );

    return await PublicationDAO.publicationTableToPublicationArray(rows, userId);
  }

  // The algorithm
  static async getForYouFeed(
    userId: User['id'],
    limit: number,
    seenPostIds: UUID[] = []
  ): Promise<Publication[]> {
    const followedCandidates = await this.getFollowedFeed(
      userId,
      Math.ceil(limit * 0.6),
      seenPostIds
    );
    const trendingCandidates = await this.getPopularPublications(
      Math.ceil(limit * 0.3),
      10,
      seenPostIds
    ); // popular in last 10 days
    const map = new Map<string, Publication>();
    for (const p of [...followedCandidates, ...trendingCandidates]) {
      if (!map.has(p.id)) map.set(p.id, p);
    }
    const candidates = Array.from(map.values());

    const positiveReactionsTypes: Reactions[] = ['like', 'love', 'haha', 'wow'];
    const negativeReactionsTypes: Reactions[] = ['sad'];
    function scorePost(p: Publication): number {
      const positiveScore = p.reactions
        ? positiveReactionsTypes.reduce((sum, type) => sum + (p.reactions?.[type] ?? 0), 0)
        : 0;
      const negativeScore = p.reactions
        ? negativeReactionsTypes.reduce((sum, type) => sum + (p.reactions?.[type] ?? 0), 0)
        : 0;

      // Calculate total number of comments including replies
      const countComments = (comments: Comment[]): number => {
        return comments.reduce((total, comment) => total + 1 + countComments(comment.replies), 0);
      };
      const commentsCount = countComments(p.comments);

      // Comments are weighted higher than reactions to represent deeper engagement
      const popularity = positiveScore - negativeScore + commentsCount * 2;

      const ageInHours = (Date.now() - p.createdAt.getTime()) / (1000 * 60 * 60);
      const recency = 1 / (1 + ageInHours); // More recent posts have higher recency
      return 1.2 * recency + 0.8 * popularity;
    }

    candidates.sort((a, b) => scorePost(b) - scorePost(a));

    const result = candidates.slice(0, limit);
    return result;
  }

  static async publicationTableToPublicationArray(
    table: PublicationTable[],
    userId?: User['id']
  ): Promise<Publication[]> {
    const res: Publication[] = [];
    for (const row of table) {
      const post = await PublicationDAO.getPublicationById(row.id, userId);
      if (post) res.push(post);
    }
    return res;
  }

  static async getPopularPublications(
    limit: number,
    nbDays: number,
    seenPostIds: UUID[] = []
  ): Promise<Publication[]> {
    // Build dynamic parameter list for seenPostIds, then nbDays and limit.
    let params: Array<UUID | number | string> = [];
    let notInClause = '';
    if (seenPostIds.length > 0) {
      const placeholders = seenPostIds.map((_, i) => `$${i + 1}`).join(', ');
      notInClause = `WHERE p.id NOT IN (${placeholders})`;
      params = params.concat(seenPostIds);
    }

    // nbDays as interval string (e.g. '10 days')
    params.push(`${nbDays} days`);
    params.push(limit);

    // nbDays placeholder index is params.length - 1, limit is params.length
    const nbDaysPlaceholder = `$${params.length - 1}`;
    const limitPlaceholder = `$${params.length}`;

    const rows = await sql.unsafe<PublicationTable[]>(
      `SELECT p.*
       FROM publication p
       LEFT JOIN reaction r ON p.id = r.post_id AND r.created_at >= NOW() - ${nbDaysPlaceholder}::interval
       ${notInClause}
       GROUP BY p.id
       ORDER BY COUNT(r.type) DESC, p.created_at DESC
       LIMIT ${limitPlaceholder}`,
      params
    );

    return await PublicationDAO.publicationTableToPublicationArray(rows);
  }

  static async deletePublication(postId: UUID): Promise<void> {
    for (const image of await this.getPostImages(postId)) {
      try {
        await unlink(`assets/publication/${image}.png`);
      } catch {
        /* empty */
      }
    }

    await sql`DELETE FROM publication WHERE id = ${postId}`;
  }

  static async getOwner(publicationId: UUID): Promise<UUID | null> {
    const rows = await sql<
      { user_id: UUID }[]
    >`SELECT user_id FROM publication WHERE id = ${publicationId}`;
    if (rows.length === 0) {
      return null;
    }
    return rows[0].user_id;
  }

  static async updatePublication(
    id: UUID,
    publication: {
      description?: string;
    }
  ): Promise<void> {
    const existingPublication = await this.getPublicationById(id);
    if (!existingPublication) {
      throw new Error('Publication not found');
    }
    await sql`UPDATE publication SET description = ${filterText(publication.description ?? existingPublication.description)} WHERE id = ${id}`;
  }

  static async writePostImage(id: UUID, imageBuffer: Buffer): Promise<void> {
    const outputPath = `assets/publication/${id}.png`;
    await writeFile(outputPath, imageBuffer);
  }

  static async hasUserPostedToday(userId: UUID): Promise<boolean> {
    const rows = await sql<
      PublicationTable[]
    >`SELECT * FROM publication WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 1`;
    const hasPosted = rows.length > 0 && DateUtils.isToday(rows[0].created_at);
    return hasPosted;
  }

  static async getPostImages(publicationId: UUID): Promise<string[]> {
    const rows = await sql<
      PublicationImageTable[]
    >`SELECT * FROM publication_image WHERE publication_id = ${publicationId}`;
    return rows.map((row) => row.id);
  }
}

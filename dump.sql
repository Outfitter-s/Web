-- Test user :
-- Username: test
-- Email: test@test.test
-- Password: testtest

INSERT INTO public.users (id, email, username, password_hash, totp_secret, created_at) VALUES
('a9fd34f8-9917-4f70-88c9-d6ad276463d3', 'test@test.test', 'test', '$2b$10$k4y0Gn/gfHeWyhpzI7hba.pJMNcZqibUln2p6pY1AHM5QEpPW04CK', NULL, '2025-11-21 08:42:46.715068');

INSERT INTO public.clothing_item (id, user_id, name, type, color) VALUES
('e72e21b3-01e7-40e7-8ca4-2735cee600d8', 'a9fd34f8-9917-4f70-88c9-d6ad276463d3', 'Black shoes', 'shoes', 'black'),
('03f18ad7-e52f-4bdb-8f04-04b094eb987c', 'a9fd34f8-9917-4f70-88c9-d6ad276463d3', 'Black shoes', 'shoes', 'black'),
('ca727857-1425-4643-9cb6-f666f60d9321', 'a9fd34f8-9917-4f70-88c9-d6ad276463d3', 'White shoes', 'shoes', 'white'),
('d432cda3-b385-48bf-9073-8c1ca60d3d38', 'a9fd34f8-9917-4f70-88c9-d6ad276463d3', 'Red sweater', 'sweater', 'red'),
('8e1d617e-3639-44a5-8ea8-88d0751d5058', 'a9fd34f8-9917-4f70-88c9-d6ad276463d3', 'Blue jeans', 'pants', 'blue'),
('730aac07-983c-4ece-99f0-9775d425abd4', 'a9fd34f8-9917-4f70-88c9-d6ad276463d3', 'Black pants', 'pants', 'black'),
('6eac116a-fc20-4229-aa4b-7aec8c52c0b6', 'a9fd34f8-9917-4f70-88c9-d6ad276463d3', 'Black shirt', 'shirt', 'black'),
('45efc73a-03d8-46a8-a476-dbac6b515b6a', 'a9fd34f8-9917-4f70-88c9-d6ad276463d3', 'Brown sweater', 'sweater', 'brown'),
('20da05b1-ecca-41d0-a0a3-7c838becdd69', 'a9fd34f8-9917-4f70-88c9-d6ad276463d3', 'Black sweater', 'sweater', 'black'),
('1245574f-606f-4f8a-ab1e-554b7c646964', 'a9fd34f8-9917-4f70-88c9-d6ad276463d3', 'Brown puffer', 'jacket', 'brown'),
('765b168c-c84d-4aea-bbb9-9b2ac0a1f901', 'a9fd34f8-9917-4f70-88c9-d6ad276463d3', 'Black leather jacket', 'jacket', 'black'),
('5f3a91e2-e7db-4900-8501-ea238ac5bc8d', 'a9fd34f8-9917-4f70-88c9-d6ad276463d3', 'Gray  pardessus', 'jacket', 'gray'),
('51373c9e-56b2-48fd-bc5d-02c1a1233822', 'a9fd34f8-9917-4f70-88c9-d6ad276463d3', 'Brown shirt', 'shirt', 'brown');

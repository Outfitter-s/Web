<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/state';
  import { Toaster } from '$lib/components/Toast/toast';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import i18n from '$lib/i18n';
  import { logger } from '$lib/utils/logger';

  let loading = $state(false);

  $effect(() => {
    if (page?.form && page.form.action === 'changePassword') {
      if (page.form.success) {
        Toaster.success(page.form.message);
      } else {
        logger.error(page.form.message);
        Toaster.error(page.form.message);
      }
    }
  });
</script>

<form
  action="?/changePassword"
  class="space-y-4"
  method="POST"
  use:enhance={() => {
    loading = true;
    return async ({ update }) => {
      update({ reset: false });
      loading = false;
    };
  }}
>
  <div class="space-y-2">
    <Label for="currentPassword">{i18n.t('auth.currentPassword')}</Label>
    <Input name="currentPassword" type="password" />
  </div>
  <div class="space-y-2">
    <Label for="newPassword">{i18n.t('auth.newPassword')}</Label>
    <Input name="newPassword" type="password" />
  </div>
  <div class="space-y-2">
    <Label for="confirmPassword">{i18n.t('auth.confirmPassword')}</Label>
    <Input name="confirmPassword" type="password" />
  </div>
  <Button type="submit" {loading}>{i18n.t('auth.resetPassword.button')}</Button>
</form>

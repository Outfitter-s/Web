<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/state';
  import { Toaster } from '$lib/components/Toast/toast';
  import * as Alert from '$lib/components/ui/alert';
  import * as Select from '$lib/components/ui/select';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { t, setLocale, locales, locale } from '$lib/i18n';
  import { logger } from '$lib/utils/logger';
  import { AlertCircle, CheckCheck, Moon, Sun } from '@lucide/svelte';
  import { toggleMode } from 'mode-watcher';

  let formValues = $state({ username: page.data.user.username, email: page.data.user.email });
  let initialFormValues = $state({ ...formValues });
  let checkUsernameStatusData = $state({
    available: false,
    loading: false,
    error: null,
    controller: new AbortController(),
  });
  let updateEmailLoading = $state(false);
  let value = $state(locale);
  const triggerContent = $derived(locales.find((f) => f === value) ?? '');

  $effect(() => {
    if (value) {
      setLocale(value);
    }
  });

  async function onUsernameInput() {
    if (formValues.username !== initialFormValues.username) {
      checkUsernameStatusData.loading = true;
      checkUsernameStatusData.available = await isUsernameTakenFunc(formValues.username);
    } else {
      checkUsernameStatusData.available = false;
    }
    checkUsernameStatusData.loading = false;
  }

  $effect(() => {
    if (page?.form && page.form.action === 'general') {
      if (page.form.success) {
        Toaster.success(page.form.message);
        initialFormValues = { ...formValues };
      } else {
        logger.error(page.form.message);
        Toaster.error(page.form.message);
      }
      page.form.action = null; // reset form action to prevent duplicate toasts
    }
  });

  async function isUsernameTakenFunc(newValue: string) {
    if (newValue.length <= 3) return false;
    checkUsernameStatusData.controller?.abort?.();
    checkUsernameStatusData.controller = new AbortController();
    const res = await fetch(`/api/auth/username-taken?username=${encodeURIComponent(newValue)}`, {
      signal: checkUsernameStatusData.controller.signal,
    });
    const data = await res.json();
    checkUsernameStatusData.error = data.error || null;
    if (data.error) {
      logger.error(data.error);
      Toaster.error(data.error);
      return false;
    }
    checkUsernameStatusData.loading = false;
    return !data.taken;
  }
</script>

<form
  action="?/updateUsername"
  class="space-y-4"
  method="POST"
  use:enhance={() => {
    checkUsernameStatusData.loading = true;
    return async ({ update }) => {
      update({ reset: false });
      checkUsernameStatusData.loading = false;
    };
  }}
>
  <div class="space-y-2">
    <Label for="username">{$t('auth.username')}</Label>
    <Input name="username" bind:value={formValues.username} oninput={onUsernameInput} />
  </div>

  {#if formValues.username !== initialFormValues.username && formValues.username.length > 3}
    {#if checkUsernameStatusData.available}
      <Alert.Root variant="success">
        <AlertCircle />
        <Alert.Title>{$t('account.tabs.general.changeUsername.alerts.available.title')}</Alert.Title
        >
        <Alert.Description>
          <p>
            {$t('account.tabs.general.changeUsername.alerts.available.description', {
              username: formValues.username,
            })}
          </p>
        </Alert.Description>
      </Alert.Root>
    {:else}
      <Alert.Root variant="destructive">
        <CheckCheck />
        <Alert.Title>{$t('account.tabs.general.changeUsername.alerts.taken.title')}</Alert.Title>
        <Alert.Description>
          <p>
            {$t('account.tabs.general.changeUsername.alerts.taken.description', {
              username: formValues.username,
            })}
          </p>
        </Alert.Description>
      </Alert.Root>
    {/if}
  {/if}

  <Button
    type="submit"
    disabled={checkUsernameStatusData.loading || formValues.username === initialFormValues.username}
    loading={checkUsernameStatusData.loading}
  >
    {$t('account.tabs.general.changeUsername.title')}
  </Button>
</form>

<form
  action="?/updateEmail"
  class="space-y-4"
  method="POST"
  use:enhance={() => {
    updateEmailLoading = true;
    return async ({ update }) => {
      update({ reset: false });
      updateEmailLoading = false;
    };
  }}
>
  <div class="space-y-2">
    <Label for="email">{$t('auth.email')}</Label>
    <Input name="email" bind:value={formValues.email} type="email" />
  </div>

  <Button
    type="submit"
    disabled={updateEmailLoading || formValues.email === initialFormValues.email}
    loading={updateEmailLoading}
  >
    {$t('account.tabs.general.changeEmail.title')}
  </Button>
</form>

<div class="space-y-2">
  <label for="language">{$t('account.tabs.general.changeLang.title')}</label>
  <Select.Root type="single" name="langue selected" bind:value>
    <Select.Trigger class="w-[180px]">
      {triggerContent}
    </Select.Trigger>
    <Select.Content>
      {#each locales as loc}
        <Select.Item value={loc} label={loc}></Select.Item>
      {/each}
    </Select.Content>
  </Select.Root>
</div>

<div class="space-y-2">
  <Label>{$t('account.tabs.general.theme.title')}</Label>
  <Button onclick={toggleMode} variant="outline" size="icon">
    <Sun class="size-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
    <Moon
      class="absolute size-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
    />
    <span class="sr-only">Toggle theme</span>
  </Button>
</div>

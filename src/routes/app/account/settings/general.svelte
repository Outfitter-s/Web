<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/state';
  import { Toaster } from '$lib/components/Toast/toast';
  import * as Alert from '$lib/components/ui/alert';
  import * as Select from '$lib/components/ui/select';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import i18n from '$lib/i18n';
  import { logger } from '$lib/utils/logger';
  import { AlertCircle, CheckCheck, Monitor, Moon, Sun, Upload } from '@lucide/svelte';
  import Theming, { availableModes, availableThemes, type Mode } from '$lib/theming/index.svelte';
  import { capitalize } from '$lib/utils';
  import ProfilePicture from '$lib/components/social/ProfilePicture.svelte';
  import Separator from '$lib/components/ui/separator/separator.svelte';

  let currentTheme = $state(page.data.theme);
  let currentLocale = $state(i18n.locale);

  let formValues = $state({ username: page.data.user.username, email: page.data.user.email });
  let initialFormValues = $state({ ...formValues });
  let checkUsernameStatusData = $state({
    available: false,
    loading: false,
    error: null,
    controller: new AbortController(),
  });
  let updateEmailLoading = $state(false);
  let isUpdatingProfilePicture = $state(false);

  async function onUsernameInput() {
    const newUsername = formValues.username.trim();
    if (newUsername !== initialFormValues.username) {
      checkUsernameStatusData.loading = true;
      checkUsernameStatusData.available = await isUsernameTakenFunc(newUsername);
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

{#snippet modeIcon(mode: Mode)}
  {#if mode === 'system'}
    <Monitor class="size-full" />
  {:else if mode === 'dark'}
    <Moon class="size-full" />
  {:else if mode === 'light'}
    <Sun class="size-full" />
  {/if}
{/snippet}

<div class="grid gap-6 grid-cols-1 md:grid-cols-2">
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
      <Label for="username">{i18n.t('auth.username')}</Label>
      <Input name="username" bind:value={formValues.username} oninput={onUsernameInput} />
    </div>

    {#if formValues.username !== initialFormValues.username && formValues.username.length > 3}
      {#if checkUsernameStatusData.available}
        <Alert.Root variant="success">
          <AlertCircle />
          <Alert.Title
            >{i18n.t(
              'account.settings.tabs.general.changeUsername.alerts.available.title'
            )}</Alert.Title
          >
          <Alert.Description>
            <p>
              {i18n.t('account.settings.tabs.general.changeUsername.alerts.available.description', {
                username: formValues.username,
              })}
            </p>
          </Alert.Description>
        </Alert.Root>
      {:else}
        <Alert.Root variant="destructive">
          <CheckCheck />
          <Alert.Title
            >{i18n.t(
              'account.settings.tabs.general.changeUsername.alerts.taken.title'
            )}</Alert.Title
          >
          <Alert.Description>
            <p>
              {i18n.t('account.settings.tabs.general.changeUsername.alerts.taken.description', {
                username: formValues.username,
              })}
            </p>
          </Alert.Description>
        </Alert.Root>
      {/if}
    {/if}

    <Button
      type="submit"
      disabled={checkUsernameStatusData.loading ||
        formValues.username === initialFormValues.username}
      loading={checkUsernameStatusData.loading}
    >
      {i18n.t('account.settings.tabs.general.changeUsername.title')}
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
      <Label for="email">{i18n.t('auth.email')}</Label>
      <Input name="email" bind:value={formValues.email} type="email" />
    </div>

    <Button
      type="submit"
      disabled={updateEmailLoading || formValues.email === initialFormValues.email}
      loading={updateEmailLoading}
    >
      {i18n.t('account.settings.tabs.general.changeEmail.title')}
    </Button>
  </form>
</div>

<form
  action="?/updateProfilePicture"
  enctype="multipart/form-data"
  class="space-y-4"
  method="POST"
  use:enhance={() => {
    isUpdatingProfilePicture = true;
    return async ({ update }) => {
      update({ reset: false });
      isUpdatingProfilePicture = false;
    };
  }}
>
  <Label>{i18n.t('account.settings.tabs.general.profilePicture')}</Label>
  <label
    for="updateProfilePictureInput"
    class="size-20 block rounded-[42%] overflow-hidden relative"
  >
    <ProfilePicture userId={page.data.user.id} class="size-full" />
    <input
      type="file"
      name="updateProfilePictureInput"
      id="updateProfilePictureInput"
      class="hidden"
      accept="image/*"
      onchange={(e) => {
        (e.target as HTMLInputElement).closest('form')?.submit();
      }}
    />
    <div class="absolute bg-background/50 inset-0 flex flex-col items-center justify-center">
      <Upload class="size-6" />
    </div>
  </label>
</form>

<Separator />

<div class="grid md:grid-cols-3 grid-cols-2 gap-4">
  <div class="flex flex-col gap-2">
    <Label for="modeSelect">{i18n.t('account.settings.tabs.general.theme.mode')}</Label>
    <Select.Root
      type="single"
      name="modeSelect"
      bind:value={currentTheme.mode.mode}
      onValueChange={() => Theming.setMode(currentTheme.mode.mode, currentTheme.theme)}
    >
      <Select.Trigger class="w-full max:w-45">
        <div class="flex items-center gap-2">
          <span class="size-4">
            {@render modeIcon(currentTheme.mode.mode)}
          </span>
          {capitalize(currentTheme.mode.mode)}
        </div>
      </Select.Trigger>
      <Select.Content>
        {#each availableModes as mode (mode)}
          <Select.Item
            value={mode}
            disabled={mode === currentTheme.mode.mode}
            class="flex items-center gap-2"
          >
            <span class="size-4">
              {@render modeIcon(mode)}
            </span>
            {capitalize(mode)}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  </div>
  <div class="flex flex-col gap-2">
    <Label for="themeSelect">{i18n.t('account.settings.tabs.general.theme.theme')}</Label>
    <Select.Root
      type="single"
      name="themeSelect"
      bind:value={currentTheme.theme}
      onValueChange={() => Theming.setTheme(currentTheme.theme, currentTheme.mode.mode)}
    >
      <Select.Trigger class="w-full max:w-45">
        {capitalize(currentTheme.theme)}
      </Select.Trigger>
      <Select.Content>
        {#each availableThemes as theme (theme)}
          <Select.Item value={theme} disabled={theme === currentTheme.theme}>
            {capitalize(theme)}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  </div>
  <div class="flex flex-col gap-2">
    <Label for="langSelect">{i18n.t('account.settings.tabs.general.changeLang.title')}</Label>
    <Select.Root
      type="single"
      name="langSelect"
      bind:value={currentLocale}
      onValueChange={(val) => i18n.setLocale(val)}
    >
      <Select.Trigger class="w-full max:w-45">
        {capitalize(i18n.getLocaleName(currentLocale))}
      </Select.Trigger>
      <Select.Content>
        {#each i18n.locales as loc (loc)}
          <Select.Item value={loc} disabled={loc === currentLocale}>
            {capitalize(i18n.getLocaleName(loc))}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  </div>
</div>

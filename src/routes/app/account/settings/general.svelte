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
  import { AlertCircle, CheckCheck, Monitor, Moon, Sun } from '@lucide/svelte';
  import Theming, { availableModes, availableThemes, type Mode } from '$lib/theming/index.svelte';
  import { capitalize } from '$lib/utils';
  import ProfilePicture from '$lib/components/social/ProfilePicture.svelte';
  import Separator from '$lib/components/ui/separator/separator.svelte';
  import { superForm } from 'sveltekit-superforms';
  import { zod4Client } from 'sveltekit-superforms/adapters';
  import { usernameSchema, emailSchema, profilePictureSchema } from './schema';
  import * as Form from '$lib/components/ui/form';

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

  const usernameForm = superForm(page.data.usernameForm, {
    validators: zod4Client(usernameSchema),
    resetForm: false,
    onUpdated: ({ form }) => {
      if (form.valid) {
        Toaster.success(form.message);
        initialFormValues.username = form.data.username;
      }
    },
  });
  const {
    form: usernameFormData,
    enhance: usernameEnhance,
    submitting: usernameSubmitting,
  } = usernameForm;

  const emailForm = superForm(page.data.emailForm, {
    validators: zod4Client(emailSchema),
    resetForm: false,
    onUpdated: ({ form }) => {
      if (form.valid) {
        Toaster.success(form.message);
        initialFormValues.email = form.data.email;
      }
    },
  });
  const { form: emailFormData, enhance: emailEnhance, submitting: emailSubmitting } = emailForm;

  const profilePictureForm = superForm(page.data.profilePictureForm, {
    validators: zod4Client(profilePictureSchema),
    resetForm: false,
    onUpdated: ({ form }) => {
      if (form.valid) {
        Toaster.success(form.message);
      }
    },
  });
  const { form: profilePictureFormData, enhance: profilePictureEnhance } = profilePictureForm;

  async function onUsernameInput() {
    const newUsername = $usernameFormData.username.trim();
    if (newUsername !== initialFormValues.username) {
      checkUsernameStatusData.loading = true;
      checkUsernameStatusData.available = await isUsernameTakenFunc(newUsername);
    } else {
      checkUsernameStatusData.available = false;
    }
    checkUsernameStatusData.loading = false;
  }

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

<form action="?/updateUsername" class="space-y-4" method="POST" use:usernameEnhance>
  <Form.Field form={usernameForm} name="username">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>{i18n.t('auth.username')}</Form.Label>
        <Input {...props} oninput={onUsernameInput} bind:value={$usernameFormData.username} />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  {#if $usernameFormData.username !== initialFormValues.username && $usernameFormData.username.length > 3}
    {#if checkUsernameStatusData.available}
      <Alert.Root variant="success">
        <CheckCheck />
        <Alert.Title
          >{i18n.t('account.tabs.general.changeUsername.alerts.available.title')}</Alert.Title
        >
        <Alert.Description>
          <p>
            {i18n.t('account.tabs.general.changeUsername.alerts.available.description', {
              username: $usernameFormData.username,
            })}
          </p>
        </Alert.Description>
      </Alert.Root>
    {:else}
      <Alert.Root variant="destructive">
        <AlertCircle />
        <Alert.Title>{i18n.t('account.tabs.general.changeUsername.alerts.taken.title')}</Alert.Title
        >
        <Alert.Description>
          <p>
            {i18n.t('account.tabs.general.changeUsername.alerts.taken.description', {
              username: $usernameFormData.username,
            })}
          </p>
        </Alert.Description>
      </Alert.Root>
    {/if}
  {/if}

  <Button
    type="submit"
    disabled={$usernameSubmitting || $usernameFormData.username === initialFormValues.username}
    loading={$usernameSubmitting}
  >
    {i18n.t('account.tabs.general.changeUsername.title')}
  </Button>
</form>

<form action="?/updateEmail" class="space-y-4" method="POST" use:emailEnhance>
  <Form.Field form={emailForm} name="email">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>{i18n.t('auth.email')}</Form.Label>
        <Input {...props} bind:value={$emailFormData.email} />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Button
    type="submit"
    disabled={$emailSubmitting || $emailFormData.email === initialFormValues.email}
    loading={$emailSubmitting}
  >
    {i18n.t('account.tabs.general.changeEmail.title')}
  </Button>
</form>

<form
  action="?/updateProfilePicture"
  enctype="multipart/form-data"
  class="space-y-4"
  method="POST"
  use:profilePictureEnhance
>
  <Label>{i18n.t('account.tabs.general.profilePicture')}</Label>
  <Form.Field form={profilePictureForm} name="profilePicture">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label class="size-20 block">
          <ProfilePicture userId={page.data.user.id} class="size-full" />
          <Input
            {...props}
            type="file"
            accept="image/*"
            onchange={(e) => {
              (e.target as HTMLInputElement).closest('form')?.submit();
            }}
            class="hidden"
            bind:value={$profilePictureFormData.profilePicture}
          />
        </Form.Label>
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>
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

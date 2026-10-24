<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { LoaderCircle, TriangleAlert, UserPlus } from '@lucide/vue'
  import { RouterLink, useRoute, useRouter } from 'vue-router'
  import { normalizeApiError } from '@/shared/lib/apiError'
  import { Button } from '@/shared/ui/components/button'
  import { matchesApi } from '../api/matchesApi'
  import { ParticipantType } from '../types'

  type PageState = 'joining' | 'error' | 'invalid'

  const route = useRoute()
  const router = useRouter()
  const state = ref<PageState>('joining')
  const message = ref<string | null>(null)

  let attemptId = 0

  function inviteCode(): string {
    const raw = route.query.code
    return typeof raw === 'string' ? raw.trim() : ''
  }

  async function join() {
    const code = inviteCode()
    if (!code) {
      state.value = 'invalid'
      return
    }

    const current = ++attemptId
    state.value = 'joining'
    message.value = null

    try {
      const match = await matchesApi.joinByCode(code, {
        type: ParticipantType.Player,
      })
      if (current !== attemptId) return
      await router.replace({ name: 'MatchWaiting', params: { matchId: match.id } })
    } catch (caught) {
      if (current !== attemptId) return
      state.value = 'error'
      message.value = normalizeApiError(caught).message ?? 'No pudimos unirte a la partida.'
    }
  }

  onMounted(join)
</script>

<template>
  <div class="mx-auto flex min-h-[60vh] w-full max-w-lg items-center justify-center">
    <section
      v-if="state === 'joining'"
      class="w-full rounded-xl border border-border bg-card p-8 text-center"
      aria-busy="true"
    >
      <LoaderCircle
        :size="28"
        class="mx-auto text-primary motion-safe:animate-spin"
        aria-hidden="true"
      />
      <h1 class="mt-4 text-xl font-bold tracking-[-0.02em]">Uniéndote a la partida…</h1>
      <p class="mt-2 text-sm text-muted-foreground">
        Estamos validando el enlace de invitación y buscando un asiento libre.
      </p>
    </section>

    <section
      v-else-if="state === 'invalid'"
      class="w-full rounded-xl border border-border bg-card p-8 text-center"
    >
      <span
        class="mx-auto grid size-12 place-items-center rounded-full bg-surface text-muted-foreground"
      >
        <UserPlus :size="22" aria-hidden="true" />
      </span>
      <h1 class="mt-4 text-xl font-bold tracking-[-0.02em]">Enlace inválido</h1>
      <p class="mt-2 text-sm text-muted-foreground">
        El enlace no incluye un código de invitación. Pedile a quien organizó la partida que te lo
        comparta de nuevo.
      </p>
      <Button as-child class="mt-5" variant="outline">
        <RouterLink to="/games">Volver al catálogo</RouterLink>
      </Button>
    </section>

    <section
      v-else
      role="alert"
      class="w-full rounded-xl border border-danger/40 bg-danger-surface p-8 text-center"
    >
      <span class="mx-auto grid size-12 place-items-center rounded-full bg-background text-danger">
        <TriangleAlert :size="22" aria-hidden="true" />
      </span>
      <h1 class="mt-4 text-xl font-bold tracking-[-0.02em] text-danger">
        No pudimos unirte a la partida
      </h1>
      <p class="mt-2 text-sm text-danger/90">{{ message }}</p>
      <div class="mt-5 flex flex-wrap justify-center gap-2">
        <Button variant="outline" @click="join">Reintentar</Button>
        <Button as-child variant="ghost">
          <RouterLink to="/games">Volver al catálogo</RouterLink>
        </Button>
      </div>
    </section>
  </div>
</template>

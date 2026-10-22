<script setup lang="ts">
  import { ArrowRight, CircleDot, Gamepad2, MessageCircle, Search, Users } from '@lucide/vue'
  import { Button } from '@/shared/ui/components/button'
  import { connectedUsersCount } from '@/shared/composables/useRealtimeConnection'

  type Game = {
    title: string
    genre: string
    players: string
    accent: string
    status: string
  }

  const games: Game[] = [
    {
      title: 'Neon Circuit',
      genre: 'Carreras',
      players: '1.284 jugando',
      accent: 'bg-[#c9f37c] text-[#183519]',
      status: 'Partidas rápidas',
    },
    {
      title: 'Orbital Clash',
      genre: 'Estrategia',
      players: '842 jugando',
      accent: 'bg-[#f6a274] text-[#442013]',
      status: 'Temporada activa',
    },
    {
      title: 'Last Outpost',
      genre: 'Cooperativo',
      players: '512 jugando',
      accent: 'bg-[#9cc6ff] text-[#122b4e]',
      status: 'Buscando equipo',
    },
  ]

  const friends = [
    { name: 'Luna', game: 'En Neon Circuit', color: 'bg-[#e8b5dc]' },
    { name: 'Mateo', game: 'En línea', color: 'bg-[#a8d8ca]' },
    { name: 'Sofi', game: 'En Orbital Clash', color: 'bg-[#f6cd8c]' },
  ]
</script>

<template>
  <div class="space-y-10">
    <section class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
      <div>
        <h1 class="max-w-2xl text-4xl font-bold leading-[1.05] tracking-[-0.035em] sm:text-5xl">
          Tu próxima partida empieza acá
        </h1>
        <p class="mt-4 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
          Encontrá un juego, invitá a tu grupo y entrá a una sala sin dar vueltas.
        </p>
      </div>
      <div class="flex items-center gap-3 rounded-lg bg-surface px-4 py-3 text-sm">
        <span
          class="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"
        >
          <CircleDot :size="18" />
        </span>

        <span>
          <strong class="block text-foreground">
            {{ connectedUsersCount === null ? '—' : connectedUsersCount.toLocaleString('es-UY') }}
            personas
          </strong>
          <span class="text-muted-foreground">conectadas ahora</span>
        </span>
      </div>
    </section>

    <section aria-labelledby="games-heading">
      <div class="mb-4 flex items-center justify-between gap-4">
        <h2 id="games-heading" class="text-2xl font-bold tracking-[-0.025em]">Juegos para vos</h2>
        <Button variant="link" size="sm">Ver catálogo <ArrowRight data-icon="inline-end" /></Button>
      </div>
      <div class="overflow-hidden rounded-xl border border-border bg-card">
        <article
          v-for="game in games"
          :key="game.title"
          class="grid gap-4 border-b border-border p-4 last:border-b-0 sm:grid-cols-[7.5rem_minmax(0,1fr)_auto] sm:items-center sm:gap-6 sm:p-5"
        >
          <div
            :class="[
              'relative flex aspect-[16/10] items-end overflow-hidden rounded-lg p-3 font-heading text-sm font-bold tracking-tight',
              game.accent,
            ]"
          >
            <Gamepad2 :size="42" stroke-width="1.5" class="absolute right-3 top-3 opacity-35" />
            <span class="relative">{{ game.genre }}</span>
          </div>
          <div>
            <h3 class="text-lg font-bold tracking-[-0.02em]">{{ game.title }}</h3>
            <p class="mt-1 text-sm text-muted-foreground">{{ game.status }} · {{ game.players }}</p>
          </div>
          <Button>Jugar <ArrowRight data-icon="inline-end" /></Button>
        </article>
      </div>
    </section>

    <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section id="activity" aria-labelledby="activity-heading">
        <div class="mb-4 flex items-center justify-between gap-4">
          <h2 id="activity-heading" class="text-2xl font-bold tracking-[-0.025em]">
            Actividad de la comunidad
          </h2>
          <Button variant="outline" size="icon" aria-label="Buscar jugadores"><Search /></Button>
        </div>
        <div class="border-y border-border">
          <div class="flex gap-4 py-4">
            <span
              class="mt-1 grid size-9 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground"
              ><Users :size="18"
            /></span>
            <p class="leading-6">
              <strong>El grupo de noche</strong> abrió una sala para
              <strong>Last Outpost</strong>.<br /><span class="text-sm text-muted-foreground"
                >Les falta una persona para empezar.</span
              >
            </p>
          </div>
          <div class="flex gap-4 border-t border-border py-4">
            <span
              class="mt-1 grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground"
              ><MessageCircle :size="18"
            /></span>
            <p class="leading-6">
              <strong>Vale</strong> compartió una estrategia en el chat de Orbital Clash.<br /><span
                class="text-sm text-muted-foreground"
                >Hace 12 minutos · 8 respuestas</span
              >
            </p>
          </div>
        </div>
      </section>

      <aside id="friends" class="rounded-xl bg-surface p-5" aria-labelledby="friends-heading">
        <div class="flex items-center justify-between gap-3">
          <h2 id="friends-heading" class="text-xl font-bold tracking-[-0.02em]">
            Amigos conectados
          </h2>
          <span class="text-sm font-semibold text-muted-foreground">{{ friends.length }}</span>
        </div>
        <ul class="mt-4 space-y-1">
          <li
            v-for="friend in friends"
            :key="friend.name"
            class="flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-background"
          >
            <span
              :class="[
                'relative grid size-9 place-items-center rounded-full text-sm font-bold text-[#17201b]',
                friend.color,
              ]"
              >{{ friend.name.slice(0, 1)
              }}<span
                class="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-surface bg-primary"
            /></span>
            <span class="min-w-0"
              ><strong class="block text-sm">{{ friend.name }}</strong
              ><span class="block truncate text-xs text-muted-foreground">{{
                friend.game
              }}</span></span
            >
          </li>
        </ul>
        <Button variant="outline" class="mt-4 w-full">Ver todos los amigos</Button>
      </aside>
    </div>
  </div>
</template>

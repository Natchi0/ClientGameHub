<script setup lang="ts">
  import { computed } from 'vue'
  import { Crown } from '@lucide/vue'
  import UserAvatar from '@/shared/ui/UserAvatar.vue'
  import { ownerParticipant } from '../lib/presentation'
  import { ParticipantType, type MatchDto } from '../types'

  const props = defineProps<{ match: MatchDto }>()

  const owner = computed(() => ownerParticipant(props.match))
</script>

<template>
  <ul class="divide-y divide-border">
    <li
      v-for="participant in match.participants"
      :key="participant.id"
      class="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
    >
      <UserAvatar :src="participant.avatar" :name="participant.nickname" size="md" />
      <div class="min-w-0 flex-1">
        <p class="flex flex-wrap items-center gap-2 font-semibold">
          <span class="truncate">{{ participant.nickname }}</span>
          <span
            v-if="owner?.id === participant.id"
            class="inline-flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-semibold text-secondary-foreground"
          >
            <Crown :size="11" aria-hidden="true" /> Anfitrión
          </span>
        </p>
        <p class="text-xs text-muted-foreground">
          {{
            participant.type === ParticipantType.Player
              ? participant.seat === null
                ? 'Jugador'
                : `Asiento ${participant.seat}`
              : 'Espectador'
          }}
        </p>
      </div>
    </li>
  </ul>
</template>

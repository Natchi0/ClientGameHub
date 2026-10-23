import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ProfilePage from '../pages/ProfilePage.vue'
import { useAuthStore } from '../stores/authStore'
import UserAvatar from '@/shared/ui/UserAvatar.vue'
import type { UserDto } from '../types'

setActivePinia(createPinia())

function mountPage(user: UserDto | null) {
  const store = useAuthStore()
  store.user = user
  const router = createRouter({ history: createWebHistory(), routes: [] })
  return mount(ProfilePage, {
    global: {
      plugins: [router],
      stubs: {
        RouterLink: { template: '<a><slot /></a>' },
      },
    },
  })
}

describe('ProfilePage', () => {
  it('muestra los datos del usuario (apodo, avatar e email)', () => {
    const wrapper = mountPage({
      id: 32,
      email: 'iron@example.com',
      nickname: 'ironHunter',
      avatar: null,
      roles: ['Guest'],
    })

    expect(wrapper.text()).toContain('ironHunter')
    expect(wrapper.text()).toContain('iron@example.com')
    expect(wrapper.findComponent(UserAvatar).exists()).toBe(true)
  })

  it('indica cuando no hay email asociado', () => {
    const wrapper = mountPage({
      id: 32,
      email: null,
      nickname: 'ironHunter',
      avatar: null,
      roles: ['Guest'],
    })

    expect(wrapper.text()).toContain('No asociado')
  })

  it('avisa al invitado y lo obliga a registrarse', () => {
    const wrapper = mountPage({
      id: 32,
      email: null,
      nickname: 'ironHunter',
      avatar: null,
      roles: ['Guest'],
    })

    expect(wrapper.text()).toContain('Invitado')
    expect(wrapper.text()).toContain('Terminá tu registro')
    expect(wrapper.text()).toContain('Crear cuenta')
    expect(wrapper.find('a').exists()).toBe(true)
  })
})

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import DashboardPage from '../pages/DashboardPage.vue'

describe('DashboardPage', () => {
  it('shows the game discovery workspace', () => {
    const wrapper = mount(DashboardPage, {
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
        },
      },
    })

    expect(wrapper.get('h1').text()).toBe('Tu próxima partida empieza acá')
    expect(wrapper.text()).toContain('Juegos para vos')
    expect(wrapper.text()).toContain('Amigos conectados')
  })
})

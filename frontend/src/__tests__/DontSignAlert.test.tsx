import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import DontSignAlert from '@/components/crisis/DontSignAlert'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('DontSignAlert', () => {
  it('renders the alert with default message', () => {
    render(<DontSignAlert />)
    expect(screen.getByText('crisis.dontSign')).toBeInTheDocument()
    expect(screen.getByText(/40% below fair value/)).toBeInTheDocument()
  })

  it('renders a custom message when provided', () => {
    render(<DontSignAlert message="Do not sign the adjuster's form." />)
    expect(screen.getByText("Do not sign the adjuster's form.")).toBeInTheDocument()
  })

  it('disappears when the dismiss button is clicked', () => {
    render(<DontSignAlert />)
    const dismissButton = screen.getByRole('button')
    fireEvent.click(dismissButton)
    expect(screen.queryByText('crisis.dontSign')).not.toBeInTheDocument()
  })
})

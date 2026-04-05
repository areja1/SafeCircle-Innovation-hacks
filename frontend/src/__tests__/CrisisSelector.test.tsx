import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import CrisisSelector from '@/components/crisis/CrisisSelector'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('CrisisSelector', () => {
  it('renders without crashing', () => {
    render(<CrisisSelector onSelect={jest.fn()} />)
    expect(screen.getByText('crisis.selectCrisis')).toBeInTheDocument()
  })

  it('renders all 5 crisis type buttons', () => {
    render(<CrisisSelector onSelect={jest.fn()} />)
    expect(screen.getByText('crisis.carAccident')).toBeInTheDocument()
    expect(screen.getByText('crisis.jobLoss')).toBeInTheDocument()
    expect(screen.getByText('crisis.medical')).toBeInTheDocument()
    expect(screen.getByText('crisis.death')).toBeInTheDocument()
    expect(screen.getByText('crisis.homeDamage')).toBeInTheDocument()
  })

  it('calls onSelect with the correct crisis type when clicked', () => {
    const onSelect = jest.fn()
    render(<CrisisSelector onSelect={onSelect} />)
    fireEvent.click(screen.getByText('crisis.jobLoss'))
    expect(onSelect).toHaveBeenCalledWith('job_loss')
  })

  it('does not call onSelect when loading', () => {
    const onSelect = jest.fn()
    render(<CrisisSelector onSelect={onSelect} loading={true} />)
    fireEvent.click(screen.getByText('crisis.carAccident'))
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('shows loading spinner when loading is true', () => {
    render(<CrisisSelector onSelect={jest.fn()} loading={true} />)
    expect(screen.getByText('Building your action plan...')).toBeInTheDocument()
  })
})

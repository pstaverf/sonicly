import { cloneElement } from 'react'
import type { ReactElement, ReactNode } from 'react'

interface InputShakeProps {
  error: boolean
  message?: ReactNode
  children: ReactElement<{ className?: string }>
}

export const InputShake = ({ error, message, children }: InputShakeProps) => {
  const className = [
    children.props.className ?? '',
    't-input',
    error ? 'is-error' : '',
    error ? 'is-shaking' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={`t-input-wrap${error ? ' is-error' : ''}`}>
      {cloneElement(children, { key: error ? 'error' : 'valid', className })}
      <p className="t-error-msg">{message}</p>
    </div>
  )
}

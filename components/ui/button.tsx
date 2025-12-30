import React from 'react'
import styles from './button.module.css'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
	children: React.ReactNode
}

export default function Button({ children, className = '', ...rest }: ButtonProps) {
	return (
		<button className={`${styles.button} ${className}`} {...rest}>
			<span className={styles.decoration} aria-hidden="true" />
			<span className={styles.label}>{children}</span>
		</button>
	)
}

interface CurrencyIconProps {
  isActive?: boolean;
  size?: number;
  forceWhite?: boolean;
}

export default function RubIcon({
  isActive = false,
  size = 14,
  forceWhite = false,
}: CurrencyIconProps) {
  const opacity = forceWhite ? "1" : isActive ? "1" : "0.6";
  const fillColor = forceWhite ? "white" : isActive ? "#000" : "white";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      className="headerCurrencyBtnIcon"
    >
      <path
        opacity={opacity}
        d="M8.00098 0C12.419 0.000263879 16.001 3.58188 16.001 8C16.0009 12.4181 12.419 15.9997 8.00098 16C3.58273 16 5.67234e-05 12.4182 0 8C0 3.58172 3.5827 0 8.00098 0ZM5.52441 3.65723V8.58203H4.11426V9.37598H5.52441V10.5H4.11426V11.293H5.52441V12.7998H6.79395V11.293H9.7207V10.5H6.79395V9.37598H8.62109C9.27911 9.37592 9.85296 9.25406 10.3418 9.01172C10.8304 8.76499 11.2087 8.4282 11.4766 8.00098C11.7492 7.56907 11.8857 7.07727 11.8857 6.52637V6.51367C11.8857 5.96276 11.7514 5.4734 11.4834 5.0459C11.2201 4.61399 10.8444 4.27415 10.3555 4.02734C9.87125 3.78057 9.29761 3.65723 8.63477 3.65723H5.52441ZM8.30371 4.71484C9.07449 4.7149 9.64525 4.87418 10.0166 5.19141C10.3927 5.50873 10.5811 5.94954 10.5811 6.51367V6.52637C10.5811 7.08607 10.3905 7.52448 10.0098 7.8418C9.63372 8.15906 9.06514 8.3183 8.30371 8.31836H6.79395V4.71484H8.30371Z"
        fill={fillColor}
      />
    </svg>
  );
}

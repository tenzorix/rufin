interface CurrencyIconProps {
  isActive?: boolean;
  size?: number;
  forceWhite?: boolean;
}

export default function UsdtIcon({
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
      <g opacity={opacity}>
        <path
          d="M7.00446 8.35491C7.13146 8.36391 7.49566 8.38571 7.99866 8.38571C8.60205 8.38571 8.90467 8.36036 8.96116 8.35536V7.03393C10.901 7.12044 12.3485 7.45898 12.3487 7.86295C12.3487 8.26794 10.9011 8.60551 8.96116 8.69152V8.69063C8.90617 8.69463 8.62255 8.7116 7.99018 8.71161C7.48518 8.71161 7.12946 8.69663 7.00446 8.69063V8.69197C5.06048 8.60646 3.60938 8.26794 3.60938 7.86295C3.6095 7.45847 5.06057 7.12003 7.00446 7.03304V8.35491Z"
          fill={fillColor}
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M8 0C12.4183 0 16 3.58172 16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0ZM4.29732 5.71339H7.00446V6.89598C4.80461 6.99698 3.15019 7.43295 3.15 7.95491C3.15 8.47691 4.80449 8.91234 7.00446 9.01384V12.8049H8.96116V9.01295C11.1576 8.91193 12.808 8.4764 12.808 7.95491C12.8078 7.43346 11.1575 6.99794 8.96116 6.89643V5.71339H11.6679V3.90937H4.29732V5.71339Z"
          fill={fillColor}
        />
      </g>
    </svg>
  );
}

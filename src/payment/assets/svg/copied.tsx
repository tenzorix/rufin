type CopiedIconProps = {
  color?: string;
  size?: number;
};

export default function CopiedIcon({
  color = "white",
  size = 14,
}: CopiedIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.325 3.50001L4.08342 10.7416L0.341797 7.00001L1.16675 6.17505L4.08342 9.09171L10.5001 2.67505L11.325 3.50001Z"
        fill={color}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.6582 5.83338L8.45826 11.0333L6.7583 9.33338L7.58326 8.50842L8.45826 9.38342L12.8333 5.00842L13.6582 5.83338Z"
        fill={color}
      />
    </svg>
  );
}

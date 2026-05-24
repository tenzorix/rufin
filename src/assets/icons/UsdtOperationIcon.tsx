import type { SVGProps } from "react";

type UsdtOperationIconProps = SVGProps<SVGSVGElement>;

export default function UsdtOperationIcon({ className, ...props }: UsdtOperationIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className={["h-5 w-5 shrink-0 [aspect-ratio:1/1]", className].filter(Boolean).join(" ")}
      {...props}
    >
      <path
        d="M8.99089 10.2756C9.12237 10.2852 9.49932 10.3076 10.0201 10.3076C10.6446 10.3076 10.958 10.2815 11.0167 10.2762V8.87261C13.0254 8.96445 14.5242 9.32422 14.5242 9.75315C14.5239 10.1831 13.0252 10.5413 11.0167 10.6326V10.6315C10.9596 10.6358 10.6661 10.6538 10.0114 10.6538C9.48851 10.6538 9.12031 10.6379 8.99089 10.6315V10.6331C6.97829 10.5424 5.47608 10.1831 5.4758 9.75315C5.4758 9.32369 6.97811 8.96445 8.99089 8.87207V10.2756Z"
        fill="white"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 0C15.5228 0 20 4.47715 20 10C20 15.5228 15.5228 20 10 20C4.47715 20 0 15.5228 0 10C0 4.47715 4.47715 0 10 0ZM6.18815 7.4707H8.99089V8.72613C6.71303 8.83337 5 9.2966 5 9.8508C5.0002 10.405 6.71317 10.8672 8.99089 10.9749V15H11.0167V10.9739C13.2909 10.8666 14.9998 10.4044 15 9.8508C15 9.29712 13.291 8.83444 11.0167 8.72667V7.4707H13.8194V5.55556H6.18815V7.4707Z"
        fill="white"
      />
    </svg>
  );
}

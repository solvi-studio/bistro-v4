"use client";

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "coral";
  href?: string;
  onClick?: () => void;
  className?: string;
}

const variants = {
  primary: "bg-[#4A90D9] text-white hover:bg-[#3a7bc8]",
  secondary: "bg-white text-gray-800 border border-gray-200 hover:bg-gray-50",
  coral: "bg-[#F4756A] text-white hover:bg-[#e5645a]",
};

export function Button({
  children,
  variant = "primary",
  href,
  onClick,
  className = "",
}: ButtonProps) {
  const base = `inline-flex items-center justify-center px-7 py-3 rounded-full font-semibold text-sm transition-colors cursor-pointer ${variants[variant]} ${className}`;

  if (href)
    return (
      <a href={href} className={base}>
        {children}
      </a>
    );
  return (
    <button onClick={onClick} className={base}>
      {children}
    </button>
  );
}

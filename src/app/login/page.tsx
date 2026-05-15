import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white px-8 text-center">
      <h1 className="text-[28px] font-semibold text-[#1a1a1a]">
        Login page here
      </h1>
      <Link
        href="/canvas"
        className="rounded-full bg-[#3b7cf4] px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#2f67dc]"
      >
        Continue
      </Link>
    </div>
  );
}

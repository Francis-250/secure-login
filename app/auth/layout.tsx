import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <div className="w-full max-w-6xl px-4 py-8 md:px-8">
        <div className="grid lg:grid-cols-2 items-center gap-8">
          {/* Auth Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0">{children}</div>

          {/* Shared Auth Image */}
          <div className="hidden lg:block aspect-[71/50] w-full">
            <Image
              src="https://readymadeui.com/images/integration-illus.webp"
              alt="Authentication illustration"
              width={500}
              height={300}
              className="w-full h-full object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </main>
  );
}

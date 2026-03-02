import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Image
            src="/logos/AZZEROCO2_LOGO_PAYOFF_ITA_POS.svg"
            alt="AzzeroCO2 Energy"
            width={220}
            height={60}
            priority
          />
        </div>
        {children}
      </div>
    </div>
  );
}

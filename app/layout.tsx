import type { Metadata } from "next"
import "./globals.css"
import { AppBrandShell } from "@/components/brand/app-brand-shell"

export const metadata: Metadata = {
title: "Easy Movers | Move Anywhere With Confidence",
description:
"Plan home shifting, office relocation and vehicle transport with EasyMovers. Request quotations and check your recorded booking status.",
}

export default function RootLayout({
children,
}: {
children: React.ReactNode
}) {

return (

<html lang="en">

  <body className="bg-slate-950 text-white antialiased overflow-x-hidden">

    <AppBrandShell>{children}</AppBrandShell>

  </body>

</html>

)
}

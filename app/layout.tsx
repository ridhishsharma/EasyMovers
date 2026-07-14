import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
title: "Easy Movers | Move Anywhere With Confidence",
description:
"AI-powered relocation platform for household shifting, office relocation, vehicle transportation, and corporate moving services across India.",
}

export default function RootLayout({
children,
}: {
children: React.ReactNode
}) {

return (

<html lang="en">

  <body className="bg-slate-950 text-white antialiased overflow-x-hidden">

    {children}

  </body>

</html>

)
}

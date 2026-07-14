import { Navbar } from "@/components/sections/navbar"
import { HeroSection } from "@/components/sections/hero"
import { TrustSection } from "@/components/sections/trust"
import { ServicesSection } from "@/components/sections/services"
import { CorporateSection } from "@/components/sections/corporate"
import { TestimonialSection } from "@/components/sections/testimonial-section"
import { VendorCTASection } from "@/components/sections/vendor-cta"
import { Footer } from "@/components/sections/footer"

export default function HomePage() {

return (

<main className="min-h-screen overflow-x-hidden bg-slate-950">

  <Navbar />

  <HeroSection />
 

  <TrustSection />

  <ServicesSection />

  <CorporateSection />

  <TestimonialSection />

  <VendorCTASection />

  <Footer />

</main>

)
}

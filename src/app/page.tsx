import { Calculator } from "@/components/home/Calculator"
import { Contact } from "@/components/home/Contact"
import { Faq } from "@/components/home/Faq"
import { Hero } from "@/components/home/Hero"
import { HomeBehaviour } from "@/components/home/HomeBehaviour"
import { HowItWorks } from "@/components/home/HowItWorks"
import { Marquee } from "@/components/home/Marquee"
import { Packages } from "@/components/home/Packages"
import { Services } from "@/components/home/Services"
import { SiteHeader } from "@/components/home/SiteHeader"
import { Statement } from "@/components/home/Statement"
import { Studio } from "@/components/home/Studio"
import { Toast } from "@/components/home/Toast"
import { Work } from "@/components/home/Work"

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="top">
        <Hero />
        <Marquee />
        <Statement />
        <Calculator />
        <Services />
        <Packages />
        <HowItWorks />
        <Work />
        <Studio />
        <Faq />
        <Contact />
      </main>
      <Toast />
      <HomeBehaviour />
    </>
  )
}

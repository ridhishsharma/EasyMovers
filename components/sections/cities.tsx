import { MapPin, TrendingUp, CheckCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function CitiesSection() {
  const cities = [
    {
      name: "Ahmedabad",
      state: "Gujarat",
      vendors: "80+",
      moves: "5,000+",
      rating: "4.8",
      gradient: "from-orange-500 to-red-500",
    },
    {
      name: "Surat",
      state: "Gujarat",
      vendors: "60+",
      moves: "3,500+",
      rating: "4.7",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      name: "Mumbai",
      state: "Maharashtra",
      vendors: "120+",
      moves: "12,000+",
      rating: "4.9",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      name: "Pune",
      state: "Maharashtra",
      vendors: "90+",
      moves: "7,500+",
      rating: "4.8",
      gradient: "from-green-500 to-teal-500",
    },
    {
      name: "Bangalore",
      state: "Karnataka",
      vendors: "150+",
      moves: "15,000+",
      rating: "4.9",
      gradient: "from-indigo-500 to-purple-500",
    },
    {
      name: "Hyderabad",
      state: "Telangana",
      vendors: "100+",
      moves: "9,000+",
      rating: "4.8",
      gradient: "from-pink-500 to-rose-500",
    },
    {
      name: "Delhi NCR",
      state: "Delhi",
      vendors: "200+",
      moves: "20,000+",
      rating: "4.9",
      gradient: "from-amber-500 to-orange-500",
    },
    {
      name: "Chennai",
      state: "Tamil Nadu",
      vendors: "85+",
      moves: "6,500+",
      rating: "4.7",
      gradient: "from-teal-500 to-green-500",
    },
  ]

  return (
    <section id="cities" className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-block">
            <span className="text-sm font-medium px-4 py-2 bg-primary/10 text-primary rounded-full border border-primary/20">
              Our Network
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold font-display">
            Serving{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              20+ Cities
            </span>{" "}
            Across India
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Connect with verified movers in major Indian cities. Expanding nationwide every month.
          </p>
        </div>

        {/* Cities Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {cities.map((city, index) => (
            <Card
              key={index}
              className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20 overflow-hidden card-shine cursor-pointer"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <CardContent className="p-6 space-y-4">
                {/* City Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold font-display group-hover:text-primary transition-colors">
                      {city.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{city.state}</p>
                  </div>
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${city.gradient} shadow-md`}>
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Verified Vendors</span>
                    <span className="font-semibold text-primary">{city.vendors}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Completed Moves</span>
                    <span className="font-semibold text-secondary">{city.moves}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Avg. Rating</span>
                    <div className="flex items-center space-x-1">
                      <span className="font-semibold text-amber-500">{city.rating}</span>
                      <span className="text-amber-500">⭐</span>
                    </div>
                  </div>
                </div>

                {/* Badge */}
                <div className="flex items-center space-x-2 pt-2 border-t border-gray-200">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-muted-foreground">Active Network</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Expansion Banner */}
        <Card className="bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 border-2 border-primary/20">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1 space-y-2 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start space-x-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-bold font-display">Expanding Nationwide</h3>
                </div>
                <p className="text-muted-foreground">
                  New cities added every month. Don't see your city? We'll help you find verified movers.
                </p>
              </div>
              <Button size="lg" className="whitespace-nowrap">
                Request New City
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

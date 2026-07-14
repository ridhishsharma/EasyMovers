import { Wine, Leaf, Monitor, Armchair, Zap, Bike, Car, Package, TrendingDown, DollarSign, Clock, Shield } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function InventorySection() {
  const specialItems = [
    { icon: Wine, label: "Fragile Items", color: "text-red-500" },
    { icon: Leaf, label: "Plants & Pots", color: "text-green-500" },
    { icon: Wine, label: "Glassware", color: "text-blue-500" },
    { icon: Monitor, label: "Electronics", color: "text-purple-500" },
    { icon: Zap, label: "Gas Cylinders", color: "text-orange-500" },
    { icon: Bike, label: "Bike Transport", color: "text-indigo-500" },
    { icon: Car, label: "Car Transport", color: "text-cyan-500" },
    { icon: Armchair, label: "Furniture", color: "text-amber-500" },
    { icon: Package, label: "Appliances", color: "text-pink-500" },
  ]

  const recommendations = [
    {
      icon: DollarSign,
      title: "Best Value",
      description: "Optimal balance of price and service quality",
      badge: "Most Popular",
      color: "from-green-500 to-emerald-600",
    },
    {
      icon: TrendingDown,
      title: "Lowest Price",
      description: "Most economical options for budget moves",
      badge: "Save More",
      color: "from-blue-500 to-cyan-600",
    },
    {
      icon: Clock,
      title: "Fastest Delivery",
      description: "Express services for urgent relocations",
      badge: "Quick Move",
      color: "from-purple-500 to-pink-600",
    },
    {
      icon: Shield,
      title: "Safest Vendor",
      description: "Top-rated for safety and care",
      badge: "Premium",
      color: "from-orange-500 to-red-600",
    },
  ]

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-muted/30 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-block">
            <span className="text-sm font-medium px-4 py-2 bg-secondary/10 text-secondary rounded-full border border-secondary/20">
              Smart Recommendations
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold font-display">
            We Handle{" "}
            <span className="bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
              Everything
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From delicate items to heavy furniture, get personalized recommendations based on your needs
          </p>
        </div>

        {/* Special Items Grid */}
        <div className="mb-16">
          <h3 className="text-xl font-semibold font-display mb-6 text-center">
            Special Items We Move
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4">
            {specialItems.map((item, index) => (
              <div
                key={index}
                className="group flex flex-col items-center space-y-2 p-4 rounded-xl hover:bg-primary/5 transition-all cursor-pointer border border-transparent hover:border-primary/20"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="p-3 rounded-xl bg-muted/50 group-hover:bg-white group-hover:shadow-lg transition-all">
                  <item.icon className={`h-6 w-6 ${item.color} group-hover:scale-110 transition-transform`} />
                </div>
                <span className="text-xs font-medium text-center text-muted-foreground group-hover:text-foreground transition-colors">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendation System */}
        <div>
          <h3 className="text-xl font-semibold font-display mb-6 text-center">
            AI-Powered Vendor Recommendations
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendations.map((rec, index) => (
              <Card
                key={index}
                className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20 overflow-hidden"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6 space-y-4">
                  {/* Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium px-3 py-1 bg-primary/10 text-primary rounded-full">
                      {rec.badge}
                    </span>
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${rec.color} shadow-md group-hover:scale-110 transition-transform`}>
                      <rec.icon className="h-5 w-5 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <h4 className="text-lg font-semibold font-display group-hover:text-primary transition-colors">
                      {rec.title}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {rec.description}
                    </p>
                  </div>

                  {/* Visual Indicator */}
                  <div className="pt-2">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${rec.color} rounded-full animate-pulse-slow`}
                        style={{ width: `${90 - index * 10}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Bottom Note */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center space-x-2 text-sm text-muted-foreground bg-muted/50 px-6 py-3 rounded-full border border-border">
            <Package className="h-5 w-5 text-primary" />
            <span className="font-medium">Our AI analyzes your requirements to suggest the perfect vendor match</span>
          </div>
        </div>
      </div>
    </section>
  )
}

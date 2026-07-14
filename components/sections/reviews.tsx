"use client"

import { Star, Quote, CheckCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function ReviewsSection() {
  const reviews = [
    {
      name: "Priya Sharma",
      location: "Mumbai to Bangalore",
      rating: 5,
      moveType: "2 BHK Home",
      review: "Excellent service! The movers were professional, careful with our belongings, and completed the move on time. The platform made it so easy to compare quotes and choose the right vendor.",
      date: "April 2026",
      verified: true,
    },
    {
      name: "Rajesh Kumar",
      location: "Delhi to Pune",
      rating: 5,
      moveType: "Office Relocation",
      review: "We relocated our entire office with zero downtime. The vendor assigned was exceptional - they handled all IT equipment with care and set up everything perfectly at the new location.",
      date: "March 2026",
      verified: true,
    },
    {
      name: "Anita Patel",
      location: "Ahmedabad to Surat",
      rating: 4,
      moveType: "3 BHK Home",
      review: "Very smooth experience from start to finish. The tracking feature was particularly helpful. Pricing was transparent and the customer support team was responsive throughout.",
      date: "April 2026",
      verified: true,
    },
    {
      name: "Vikram Singh",
      location: "Hyderabad to Chennai",
      rating: 5,
      moveType: "Car Transport",
      review: "Used the service for car transportation and I'm impressed! The vehicle arrived in perfect condition. Real-time tracking gave me peace of mind throughout the journey.",
      date: "March 2026",
      verified: true,
    },
    {
      name: "Meera Reddy",
      location: "Bangalore to Mumbai",
      rating: 5,
      moveType: "1 BHK Home",
      review: "As a solo professional moving cities, this platform made everything hassle-free. Got competitive quotes, chose the best vendor, and the entire process was seamless.",
      date: "February 2026",
      verified: true,
    },
    {
      name: "Amit Desai",
      location: "Pune to Delhi NCR",
      rating: 4,
      moveType: "4 BHK Home",
      review: "Large household move handled efficiently. The packing quality was excellent and nothing was damaged. Would definitely recommend to anyone looking for reliable movers.",
      date: "April 2026",
      verified: true,
    },
  ]

  const stats = [
    { value: "4.8/5.0", label: "Average Rating" },
    { value: "50,000+", label: "Happy Customers" },
    { value: "98%", label: "Satisfaction Rate" },
    { value: "45,000+", label: "Verified Reviews" },
  ]

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-block">
            <span className="text-sm font-medium px-4 py-2 bg-accent/10 text-accent rounded-full border border-accent/20">
              Customer Reviews
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold font-display">
            Trusted by{" "}
            <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              Thousands
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real feedback from real customers who trusted us with their relocation
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="text-center border-2 hover:border-primary/20 hover:shadow-lg transition-all"
            >
              <CardContent className="p-6">
                <div className="text-3xl font-bold font-display bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Reviews Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review, index) => (
            <Card
              key={index}
              className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20 overflow-hidden"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6 space-y-4">
                {/* Quote Icon */}
                <div className="flex items-start justify-between">
                  <Quote className="h-8 w-8 text-primary/20" />
                  {review.verified && (
                    <div className="flex items-center space-x-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      <CheckCircle className="h-3 w-3" />
                      <span className="font-medium">Verified Move</span>
                    </div>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating
                          ? "text-amber-400 fill-amber-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="text-sm font-medium text-muted-foreground ml-2">
                    {review.rating}.0
                  </span>
                </div>

                {/* Review Text */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  "{review.review}"
                </p>

                {/* Customer Info */}
                <div className="pt-4 border-t border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm">{review.name}</div>
                      <div className="text-xs text-muted-foreground">{review.location}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-primary">{review.moveType}</div>
                      <div className="text-xs text-muted-foreground">{review.date}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            Join thousands of satisfied customers
          </p>
          <a href="#home" className="inline-block">
            <button className="px-8 py-3 bg-gradient-to-r from-primary to-secondary text-white font-medium rounded-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
              Get Your Free Quote
            </button>
          </a>
        </div>
      </div>
    </section>
  )
}

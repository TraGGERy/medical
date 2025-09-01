'use client';

import React from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import RealtimeDashboard from '@/components/RealtimeDashboard';
import HealthDataInput from '@/components/HealthDataInput';
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Badge = React.forwardRef<
  HTMLSpanElement,
  React.ComponentProps<"span"> &
    VariantProps<typeof badgeVariants> & { asChild?: boolean }
>(({ className, variant, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      ref={ref}
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
});
Badge.displayName = "Badge";
import { 
  Activity, 
  Brain, 
  Shield, 
  Zap, 
  Clock, 
  Bell,
  TrendingUp,
  Heart
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Inline UI Components
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  )
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "text-2xl font-semibold leading-none tracking-tight",
        className
      )}
      {...props}
    />
  )
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
)
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
)
CardContent.displayName = "CardContent"

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variants = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline",
    }
    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      icon: "h-10 w-10",
    }
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

/**
 * Real-time Health Monitoring Page
 * Showcases the "Real-time AI Symptom Analysis" game-changing feature
 */

export default function RealtimeMonitoringPage() {
  // Authenticate user
  const { user, isLoaded } = useUser();
  
  if (!isLoaded) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    redirect('/sign-in');
    return null;
  }
  
  const userId = user.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Real-time Health Monitoring
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the future of healthcare with AI-powered real-time symptom analysis, 
            continuous health monitoring, and instant alerts.
          </p>
          
          {/* Feature Badges */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            <Badge variant="secondary" className="px-3 py-1 text-sm">
              <Brain className="w-4 h-4 mr-1" />
              AI-Powered Analysis
            </Badge>
            <Badge variant="secondary" className="px-3 py-1 text-sm">
              <Zap className="w-4 h-4 mr-1" />
              Real-time Processing
            </Badge>
            <Badge variant="secondary" className="px-3 py-1 text-sm">
              <Bell className="w-4 h-4 mr-1" />
              Instant Alerts
            </Badge>
            <Badge variant="secondary" className="px-3 py-1 text-sm">
              <Shield className="w-4 h-4 mr-1" />
              HIPAA Compliant
            </Badge>
            <Badge variant="secondary" className="px-3 py-1 text-sm">
              <TrendingUp className="w-4 h-4 mr-1" />
              Predictive Insights
            </Badge>
          </div>
        </div>

        {/* Feature Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg text-blue-900">Continuous Monitoring</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-blue-700">
                24/7 real-time analysis of your health data with instant anomaly detection 
                and threshold monitoring for proactive health management.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50/50">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-purple-600" />
                <CardTitle className="text-lg text-purple-900">AI Symptom Analysis</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-purple-700">
                Advanced machine learning algorithms analyze patterns in your health data 
                to detect early warning signs and provide personalized recommendations.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-green-600" />
                <CardTitle className="text-lg text-green-900">Personalized Care</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-green-700">
                Tailored health insights based on your unique health profile, medical history, 
                and real-time data patterns for optimal health outcomes.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard */}
        <RealtimeDashboard userId={userId} />

        {/* Data Input Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <HealthDataInput 
              onDataSubmitted={(data) => {
                console.log('New health data submitted:', data);
                // The RealtimeDashboard will automatically update via WebSocket
              }}
            />
          </div>
          
          {/* Information Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span>How It Works</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Data Collection</h4>
                      <p className="text-xs text-gray-600">
                        Input health data manually or connect wearable devices for automatic monitoring.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-semibold">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">AI Analysis</h4>
                      <p className="text-xs text-gray-600">
                        Our AI continuously analyzes your data for patterns, anomalies, and health insights.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Instant Alerts</h4>
                      <p className="text-xs text-gray-600">
                        Receive immediate notifications for any concerning changes or threshold breaches.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-semibold">
                      4
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Actionable Insights</h4>
                      <p className="text-xs text-gray-600">
                        Get personalized recommendations and connect with healthcare providers when needed.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-green-500" />
                  <span>Privacy & Security</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>HIPAA Compliant</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>End-to-End Encryption</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Secure Data Storage</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>User-Controlled Access</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Activity className="w-4 h-4 mr-2" />
                  View Health Trends
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Bell className="w-4 h-4 mr-2" />
                  Configure Alerts
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Export Health Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Information */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Experience the Future of Healthcare Today
              </h3>
              <p className="text-gray-600">
                This real-time monitoring system represents a revolutionary approach to preventive healthcare, 
                combining cutting-edge AI with continuous health monitoring for unprecedented health insights.
              </p>
              <div className="flex justify-center space-x-4 mt-4">
                <Button variant="default">
                  Connect Wearable Device
                </Button>
                <Button variant="outline">
                  Learn More
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
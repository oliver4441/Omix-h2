"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ShieldCheck, 
  ArrowRight, 
  Users, 
  GraduationCap, 
  BookOpen, 
  ClipboardCheck, 
  FileSpreadsheet, 
  DollarSign, 
  Bot, 
  Globe,
  Smartphone,
  Zap,
  CheckCircle2,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white selection:bg-omix-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0A0A0B]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-omix-500 to-omix-700 flex items-center justify-center glow-sm">
              <span className="text-white font-bold text-sm">OS</span>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white leading-tight">omixschools</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">omixERP for Juniors</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</Link>
            <Link href="#about" className="text-sm text-gray-400 hover:text-white transition-colors">About</Link>
            <Link href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">Pricing</Link>
            <Link href="/login" className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-white hover:bg-white/10 transition-all">
              School Login
            </Link>
          </div>
          
          <button className="md:hidden text-gray-400">
            <Zap className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 lg:pt-56 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-omix-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-omix-500/10 border border-omix-500/20 text-omix-400 text-xs font-bold mb-6 tracking-wide uppercase"
            >
              <Zap className="w-3 h-3 fill-current" />
              The Future of Education Management
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl lg:text-7xl font-bold tracking-tight text-white mb-8 leading-[1.1]"
            >
              Simplifying School Operations <br />
              <span className="gradient-text">Through Advanced AI.</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              omixschools offers the most sophisticated ERP for Kenyan schools. 
              One powerful platform for administration, academics, and parents.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 bg-omix-500 hover:bg-omix-400 text-white rounded-2xl font-bold shadow-lg shadow-omix-500/25 transition-all flex items-center justify-center gap-2 group"
              >
                Get Started Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#demo"
                className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                Book a Demo
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { label: "Partner Schools", value: "47+" },
              { label: "Active Students", value: "12k+" },
              { label: "Operations Automated", value: "100%" },
              { label: "Customer Support", value: "24/7" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="relative">
              <div className="absolute -top-10 -left-10 w-64 h-64 bg-omix-500/20 rounded-full blur-[80px]" />
              <div className="glass rounded-[2rem] p-4 border border-white/5 aspect-square flex items-center justify-center relative overflow-hidden">
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-surface to-surface-2 flex items-center justify-center border border-white/5">
                  <Bot className="w-32 h-32 text-omix-500 opacity-20" />
                </div>
              </div>
            </div>
            
            <div>
              <div className="text-omix-400 text-xs font-bold uppercase tracking-[0.2em] mb-6">About omixschools</div>
              <h2 className="text-4xl font-bold text-white mb-8 leading-tight">
                Smarter Operations for <br />
                <span className="gradient-text">Next-Gen Institutions.</span>
              </h2>
              <p className="text-gray-400 mb-8 text-lg leading-relaxed">
                omixERP for Juniors is a leading school management system designed to ensure efficient operations 
                by integrating all school activities into one streamlined, AI-powered platform. 
                Our software stands out as the most preferred system in Kenya, providing comprehensive solutions 
                for administration, academics, and communication.
              </p>
              
              <div className="space-y-4">
                {[
                  "Secure Cloud Infrastructure",
                  "AI-Driven Performance Analytics",
                  "Automated Fee Reconciliation",
                  "Mobile-First Experience"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-omix-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-32 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Built for Every Role</h2>
            <p className="text-gray-400">An extraordinary ERP solution tailored for everyone in your school community.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "For Admins",
                icon: ShieldCheck,
                features: ["HR Management", "Centralized Data", "Fee Automation", "Advanced Reporting"]
              },
              {
                title: "For Teachers",
                icon: GraduationCap,
                features: ["Academic Tracking", "Parent Communication", "Record Management", "Attendance Logs"]
              },
              {
                title: "For Students",
                icon: Users,
                features: ["Timetables", "Study Materials", "Exam Results", "Performance Metrics"]
              },
              {
                title: "For Parents",
                icon: Smartphone,
                features: ["Fee Payments", "Progress Tracking", "School Notifications", "Instant Messaging"]
              }
            ].map((role, i) => (
              <div key={i} className="glass rounded-[2rem] p-8 border border-white/5 hover:border-omix-500/20 transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-omix-500/10 flex items-center justify-center mb-6 ring-1 ring-white/5 group-hover:ring-omix-500/20 transition-all">
                  <role.icon className="w-6 h-6 text-omix-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-6">{role.title}</h3>
                <ul className="space-y-3">
                  {role.features.map((feat, j) => (
                    <li key={j} className="text-xs text-gray-500 flex items-center gap-2">
                      <div className="w-1 h-1 bg-omix-500 rounded-full" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass rounded-[3rem] p-12 lg:p-20 border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-omix-500/5 rounded-full blur-[80px]" />
            
            <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
              <div>
                <h2 className="text-4xl font-bold text-white mb-8">Comprehensive Modules for Seamless Administration</h2>
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-10">
                  {[
                    { title: "Bursar (Finance)", icon: DollarSign },
                    { title: "Library", icon: BookOpen },
                    { title: "Science Lab", icon: Zap },
                    { title: "Computer Lab", icon: Globe },
                    { title: "Attendance", icon: ClipboardCheck },
                    { title: "Grades & Exams", icon: FileSpreadsheet },
                  ].map((mod, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <mod.icon className="w-5 h-5 text-omix-400" />
                      </div>
                      <span className="text-sm font-medium text-gray-300">{mod.title}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-[#0A0A0B] rounded-3xl p-8 border border-white/5 shadow-2xl">
                <div className="text-omix-400 text-xs font-bold uppercase tracking-widest mb-4">Request a Demo</div>
                <h3 className="text-xl font-bold text-white mb-6">Experience omixschools</h3>
                <form className="space-y-4">
                  <input type="text" placeholder="Full Name" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-omix-500" />
                  <input type="email" placeholder="Email Address" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-omix-500" />
                  <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-omix-500 text-gray-400">
                    <option>Select Institution Size</option>
                    <option>0 - 200 Students</option>
                    <option>200 - 500 Students</option>
                    <option>500+ Students</option>
                  </select>
                  <button className="w-full py-4 bg-omix-500 hover:bg-omix-400 text-white rounded-xl font-bold transition-all shadow-lg shadow-omix-500/20">
                    Book My Demo
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-omix-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">OS</span>
                </div>
                <span className="text-xl font-bold text-white">omixschools</span>
              </div>
              <p className="text-gray-500 text-sm max-w-sm leading-relaxed">
                Revolutionizing school operations in Kenya with cutting-edge AI and seamless multi-tenant architecture. 
                Built by omixsystems.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Product</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                <li><Link href="#" className="hover:text-omix-400 transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-omix-400 transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-omix-400 transition-colors">Mobile App</Link></li>
                <li><Link href="#" className="hover:text-omix-400 transition-colors">Security</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Company</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                <li><Link href="#" className="hover:text-omix-400 transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-omix-400 transition-colors">Contact</Link></li>
                <li><Link href="#" className="hover:text-omix-400 transition-colors">Partner Program</Link></li>
                <li><Link href="#" className="hover:text-omix-400 transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-600 tracking-widest font-bold uppercase">
              &copy; 2026 omixsystems. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="#" className="text-gray-600 hover:text-omix-400 transition-colors text-xs font-bold uppercase tracking-widest">Twitter</Link>
              <Link href="#" className="text-gray-600 hover:text-omix-400 transition-colors text-xs font-bold uppercase tracking-widest">LinkedIn</Link>
              <Link href="#" className="text-gray-600 hover:text-omix-400 transition-colors text-xs font-bold uppercase tracking-widest">GitHub</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

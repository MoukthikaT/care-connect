import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, ShieldCheck, Sparkles, Wrench, Droplets, Zap, Wind, Cog, HeartHandshake, CalendarCheck, BadgeCheck } from 'lucide-react';
import api from '../services/api';
import Logo from '../components/common/Logo';
import Button from '../components/common/Button';

const icons = { droplets: Droplets, plumbing: Droplets, zap: Zap, electrical: Zap, wind: Wind, hvac: Wind, cog: Cog, sparkles: Sparkles };

export default function LandingPage() {
  const [categories, setCategories] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  useEffect(() => {
    let active = true;
    api.get('/categories').then(({ data }) => {
      if (active) { setCategories(data.categories || []); setLoadState('ready'); }
    }).catch(() => { if (active) setLoadState('error'); });
    return () => { active = false; };
  }, []);

  return <div className="landing-page">
    <section className="landing-hero">
      <div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/>
      <div className="hero-copy">
        <div className="eyebrow"><span className="eyebrow-dot"/> Home services, thoughtfully connected</div>
        <Logo size="lg" showTagline={false}/>
        <h1>Good help.<br/><em>Closer to home.</em></h1>
        <p>Describe what your home needs. CareConnect brings your request, a considered match, and every next step into one calm place.</p>
        <div className="hero-actions"><Button to="/services" variant="primary" size="lg" icon={ArrowRight}>Explore services</Button><Link className="text-link" to="/register">Join as a professional <ArrowUpRight size={16}/></Link></div>
        <div className="hero-assurance"><ShieldCheck size={17}/> Verified provider workflow <span/> Clear requests and quotes <span/> Progress you can follow</div>
      </div>
      <div className="hero-art" aria-label="CareConnect service request journey">
        <div className="hero-art-glow"/><div className="hero-house"><div className="house-roof"/><div className="house-body"><div className="house-window"/><div className="house-door"/></div><div className="house-heart"><HeartHandshake size={25}/></div></div>
        <div className="float-card request-float"><span className="float-icon"><Wrench size={18}/></span><div><b>Your request</b><small>Understood and organized</small></div><BadgeCheck size={19} className="float-check"/></div>
        <div className="float-card match-float"><span className="float-icon plum"><Sparkles size={18}/></span><div><b>Thoughtful matching</b><small>Based on skills and availability</small></div><span className="match-line"/></div>
        <div className="art-caption">A more human way to care for home <span>01 / 03</span></div>
      </div>
    </section>

    <section className="category-section" id="services">
      <div className="section-heading"><div><div className="eyebrow">Start with what you need</div><h2>Care for every corner<br/><em>of home.</em></h2></div><Link className="text-link" to="/services">Browse all services <ArrowRight size={16}/></Link></div>
      {loadState === 'loading' && <div className="category-grid" aria-label="Loading categories">{[1,2,3,4].map(n=><div className="category-skeleton" key={n}/>)}</div>}
      {loadState === 'error' && <div className="data-state"><p>Service categories are temporarily unavailable.</p><button onClick={()=>{setLoadState('loading');api.get('/categories').then(({data})=>{setCategories(data.categories||[]);setLoadState('ready');}).catch(()=>setLoadState('error'));}}>Try again</button></div>}
      {loadState === 'ready' && categories.length === 0 && <div className="data-state"><div className="empty-mark"><Wrench/></div><h3>New services are on their way</h3><p>There are no active service categories yet. Check back soon.</p></div>}
      {loadState === 'ready' && categories.length > 0 && <div className="category-grid">{categories.slice(0,8).map((category,index)=>{const Icon=icons[(category.icon||'').toLowerCase()]||Wrench;return <Link className="category-card" to={`/services?category=${encodeURIComponent(category.name)}`} key={category._id}><span className="category-index">0{index+1}</span><span className="category-icon"><Icon size={21}/></span><h3>{category.name}</h3><p>{category.description || 'Explore services in this category.'}</p><span className="category-arrow"><ArrowUpRight size={17}/></span></Link>;})}</div>}
    </section>

    <section className="workflow-section" id="how-it-works"><div className="workflow-intro"><div className="eyebrow">A clearer path to cared-for</div><h2>From “something’s wrong”<br/>to <em>“that’s taken care of.”</em></h2><p>One connected flow keeps decisions and updates close at hand, for the people requesting help and the people providing it.</p><Link to="/register" className="text-link">Get started with CareConnect <ArrowRight size={16}/></Link></div><div className="workflow-steps"><article><span>01</span><div className="step-icon"><Wrench/></div><div><h3>Tell us what’s up</h3><p>Share the job and the details that matter.</p></div></article><article><span>02</span><div className="step-icon"><Sparkles/></div><div><h3>Find the right fit</h3><p>Request matching considers skills and service needs.</p></div></article><article><span>03</span><div className="step-icon"><CalendarCheck/></div><div><h3>Stay in the loop</h3><p>Compare quotes, follow bookings, and close the loop.</p></div></article></div></section>

    <section className="trust-banner"><div className="trust-icon"><ShieldCheck size={27}/></div><div><div className="eyebrow">Built around confidence</div><h2>Good work begins<br/>with a little more trust.</h2><p>Provider verification, accountable workflows, and updates that keep customers and professionals connected.</p></div><Button to="/services" variant="secondary" icon={ArrowRight}>Find your service</Button></section>
    <section className="provider-cta"><div><div className="eyebrow">For the people who make home work</div><h2>Bring your craft<br/><em>to the right homes.</em></h2></div><div><p>Build your provider profile, share your skills, and manage opportunities with CareConnect.</p><Button to="/register" variant="primary" icon={ArrowRight}>Join as a provider</Button></div></section>
  </div>;
}

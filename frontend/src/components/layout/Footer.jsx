import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Mail, ShieldCheck } from 'lucide-react';
import Logo from '../common/Logo';
import api from '../../services/api';

export default function Footer() {
  const [categories, setCategories] = useState([]);
  useEffect(() => { api.get('/categories').then(({ data }) => setCategories(data.categories || [])).catch(() => setCategories([])); }, []);
  return <footer className="site-footer"><div className="footer-main"><div className="footer-brand"><Logo size="lg" variant="inverse"/><p>A considered connection between the people who need a hand at home and the professionals who know how to help.</p><span className="footer-trust"><ShieldCheck size={16}/> Trust built into every step</span></div>
    <div className="footer-column"><h3>Explore</h3><Link to="/services">All services <ArrowUpRight size={14}/></Link><Link to="/#how-it-works">How it works <ArrowUpRight size={14}/></Link><Link to="/register">Create an account <ArrowUpRight size={14}/></Link></div>
    <div className="footer-column"><h3>Services</h3>{categories.length ? categories.slice(0,5).map(cat=><Link key={cat._id} to={`/services?category=${encodeURIComponent(cat.name)}`}>{cat.name}</Link>) : <span className="footer-muted">Categories will appear here when available.</span>}</div>
    <div className="footer-column"><h3>Get in touch</h3><a href="mailto:support@careconnect.com"><Mail size={15}/> support@careconnect.com</a><p className="footer-muted">Questions about a request or booking? Our support team can help.</p></div></div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} CareConnect</span><span>Made for homes, and the people who care for them.</span></div></footer>;
}

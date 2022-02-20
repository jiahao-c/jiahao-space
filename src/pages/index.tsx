import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import './index.css';
import HomepageFeatures from '../components/HomepageFeatures';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className='hero hero--primary heroBanner'
    style={{
      background:"linear-gradient(to right, #00b09b, #96c93d)"
    }}
    >
      <div className="container">
        <h1 className="hero__title"
        >Hello, I'm Jiahao (嘉豪)</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className='buttons'>
          <Link
            className="button button--secondary button--lg"
            to="/projects">
            Take a look at my work
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  return (
    <Layout
      description="Description will go into a meta tag in <head />">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}

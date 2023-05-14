import '@arco-design/web-react/dist/css/arco.css';

import Layout from "@theme/Layout";
import React from "react";
import { Spin } from "@arco-design/web-react";
import ProjectCard, { IProject } from "../../components/ProjectCard";
import { Masonry } from "masonic";
import useSWR from 'swr'

const fetcher = (input: RequestInfo, init?: RequestInit) => 
  fetch(input, init).then(res => res.json());

function ProjectsHeader() {
  return (
    <header
      className="hero hero--primary"
      style={{
        justifyContent: "center",
        background: "linear-gradient(to right, #00b09b, #96c93d)",
      }}
    >
      <h1 style={{ fontFamily: "Spectral, serif" }}>Projects</h1>
    </header>
  );
}

function ProjectsMain() {
    const { data,  error, isLoading } = useSWR('/api/get_projects', fetcher)
    if (error) return <div>failed to load</div>
    if (isLoading) return <Spin size={40}/>
    const projects : IProject[] = data.projects;
    return (
        <Masonry
        // Provides the data for our grid items
        items={projects}
        // Adds 8px of space between the grid cells
        columnGutter={30}
        // Sets the minimum column width to 172px
        columnWidth={230}
        // This is the grid item component
        render={ProjectCard}
        />
    )
}


export default function Home() {  
  return (
    <Layout title="Projects" description="My side projects">
      <ProjectsHeader />
      <main
      style={{padding: "3rem 3rem"}}
      >
        <ProjectsMain />
      </main>
    </Layout>
  );
}

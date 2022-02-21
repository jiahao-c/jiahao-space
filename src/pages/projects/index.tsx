import Layout from "@theme/Layout";
import React from "react";
import { projects } from "@site/static/data/projects";
import "./projects.less";
import ProjectCard from "@site/src/components/ProjectCard";
import { Masonry } from "masonic";


function ProjectsHeader() {
  return (
    <header className="hero hero--primary" style={{ 
      justifyContent:"center",
      background:"linear-gradient(to right, #00b09b, #96c93d)",
      }}>
        <h1 style={{fontFamily: "Spectral, serif"}}>Projects</h1>
    </header>
  );
}

//font-family: Spectral, serif

export default function Home(): JSX.Element {
  return (
    <Layout
      title="Projects"
      description="My side projects"
    >
      <ProjectsHeader />
      <main
      className="antd-container"
      >
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
      </main>
    </Layout>
  );
}

import Layout from "@theme/Layout";
import React from "react";
import { projects } from "@site/static/data/projects";
import "./projects.less";
import {Space } from "antd";
import ProjectCard from "@site/src/components/ProjectCard";
import { Masonry } from "masonic";
// import "antd/dist/antd.css";

function ProjectsHeader() {
  return (
    <header className="hero hero--primary" style={{ 
      textAlign: "center",
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
      description="Description will go into a meta tag in <head />"
    >
      <ProjectsHeader />
      <main
      className="antd-container"
      >
        <Masonry
          // Provides the data for our grid items
          items={projects}
          // Adds 8px of space between the grid cells
          columnGutter={10}
          // Sets the minimum column width to 172px
          columnWidth={300}
          // This is the grid item component
          render={ProjectCard}
        />
      </main>
    </Layout>
  );
}

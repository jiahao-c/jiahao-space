import Layout from "@theme/Layout";
import React from "react";
import { projects } from "@site/static/data/projects";
import "./projects.css";
import {Space } from "antd";
import ProjectCard from "@site/src/components/ProjectCard";
import "antd/dist/antd.css";

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
      <main>
        <Space
        style={{
          marginTop: "3rem",
          paddingLeft: "6rem",
          paddingRight: "6rem",
        }}
        >
            {/* <Masonry columns={{ xs: 1, sm: 2, lg: 3 }} spacing={5}> */}
              {projects.map((project) => (
                <ProjectCard
                tags={project.tags}
                text={project.text}
                name={project.name}
                imgSrc={project.imgSrc}
                demoLink={project.demoLink}
                repoLink={project.repoLink}
              />
              ))}
            {/* </Masonry> */}
        </Space>
      </main>
    </Layout>
  );
}

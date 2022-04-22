import Layout from "@theme/Layout";
import React, { useEffect, useState } from "react";
import { Spin } from "antd";
import "./projects.less";
import ProjectCard from "@site/src/components/ProjectCard";
import { Masonry } from "masonic";
import { supabase } from "@site/src/supabaseClient";

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

interface IProject {
  id: number;
  name: string;
  tags: string[];
  text: string;
  imgSrc: string;
  demoLink?: string;
  repoLink?: string;
}

export default function Home(): JSX.Element {
  const [projects, setProjects] = useState<IProject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    let { data: projectData, error } = await supabase
      .from("project")
      .select("*");
    if (error) console.log("error", error);
    else {
      setProjects(projectData);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects().catch(console.error);
  }, []);

  return (
    <Layout title="Projects" description="My side projects">
      <ProjectsHeader />
      <main className="antd-container">
        {loading ? (
          <Spin size="large" />
        ) : (
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
        )}
      </main>
    </Layout>
  );
}

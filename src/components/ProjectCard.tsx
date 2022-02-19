import React from "react";
import "antd/dist/antd.css";
import { Card, Tag } from "antd";
import "./ProjectCard.css"
import { GithubOutlined, EyeOutlined } from "@ant-design/icons";
import { IProject } from "@site/static/data/projects";

//<Col lg={8} md={12} sm={24}>
export default (props: IProject) => {
  const { name, tags, text, imgSrc, demoLink, repoLink } = props;
  return (
    <div className="card">
    <Card
      bodyStyle={{ padding: "0" }}
      hoverable={true}
      style={{ width: 300}}
      cover={<img alt="example" src={imgSrc} />}
      actions={[
        <a href={demoLink} target="_blank">
          <EyeOutlined />
        </a>,
        <a href={repoLink} target="_blank">
          <GithubOutlined />
        </a>
      ]}
    >
      <div className="cardBody">
      <h2>{name}</h2>
      <div className="tags">
      {tags.map(tagName => (
        <Tag color="#38B2AC">{tagName}</Tag>
      ))}
      </div>
      <p>{text}</p>
      </div>
    </Card>
    </div>
  );
};
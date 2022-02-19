import React from "react";
// import "antd/dist/antd.css";
import { Card, Tag } from "antd";
import "./ProjectCard.css"
import { GithubOutlined, EyeOutlined } from "@ant-design/icons";
import { IProject } from "@site/static/data/projects";

//<Col lg={8} md={12} sm={24}>
export default ({data:{ name, tags, text, imgSrc, demoLink, repoLink }} :{data:IProject}) => {
  return (
  
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
      <h3>{name}</h3>
      <div className="tags">
      {tags.map(tagName => (
        <Tag color="#38B2AC">{tagName}</Tag>
      ))}
      </div>
      <p>{text}</p>
      </div>
    </Card>
  );
};
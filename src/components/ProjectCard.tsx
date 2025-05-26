import { Card, Space, Tag } from '@arco-design/web-react';
import { IconGithub, IconEye } from '@arco-design/web-react/icon';

export interface IProject {
    id: string;
    name: string;
    tags: string[];
    text: string;
    imgSrc: string;
    demoLink?: string;
    repoLink?: string;
}
  
export default ({data:{ name, tags, text, imgSrc, demoLink, repoLink }} :{data:IProject}) => {
    return (
      <Card
        hoverable={true}
        cover={<img alt="example" src={imgSrc} />}
        actions={[
          demoLink && <a href={demoLink} target="_blank">
            <IconEye />
          </a>,
          <a href={repoLink} target="_blank">
            <IconGithub />
          </a>
        ]}
        style={{textAlign: "center"}}
      >
        <h3>{name}</h3>
        <Space wrap>
        {tags.map(tagName => (
          <Tag color="#38B2AC"
          style={{
            color: "white",
          }}
          >{tagName}</Tag>
        ))}
        </Space>
        <p>{text}</p>
      </Card>
    );
};
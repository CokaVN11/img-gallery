import React, { useState, useEffect, useRef } from 'react';
import { Tree, Layout, Typography } from 'antd';
import { FolderOutlined } from '@ant-design/icons';
import { CustomImage } from './CustomImage';
import { Img } from '../types/img';

const { Content, Sider } = Layout;
const { Title } = Typography;

interface FileExplorerProps {
  data: Record<string, any>;
}

interface TreeNode {
  title: string;
  key: string;
  icon: React.ReactNode;
  children?: TreeNode[];
}

interface FolderContent {
  name: string;
  images: Img[];
}

const FileExplorer: React.FC<FileExplorerProps> = ({ data }) => {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [folderContents, setFolderContents] = useState<Record<string, FolderContent>>({});
  const folderRefs = useRef<{ [key: string]: React.RefObject<HTMLDivElement> }>({});

  useEffect(() => {
    const { treeNodes, contents } = processData(data);
    setTreeData(treeNodes);
    setFolderContents(contents);
  }, [data]);

  const processData = (
    data: Record<string, any>,
    parentKey = '',
    parentName = 'Root'
  ): { treeNodes: TreeNode[]; contents: Record<string, FolderContent> } => {
    const treeNodes: TreeNode[] = [];
    const contents: Record<string, FolderContent> = {};

    Object.entries(data).forEach(([key, value]) => {
      const currentKey = parentKey ? `${parentKey}-${key}` : key;

      if (value.type === 'folder') {
        const { treeNodes: childNodes, contents: childContents } = processData(value.children, currentKey, value.name);
        treeNodes.push({
          title: value.name,
          key: currentKey,
          icon: <FolderOutlined />,
          children: childNodes,
        });
        Object.assign(contents, childContents);
      } else if (value.type === 'image' || value.type === 'video') {
        const folderKey = parentKey || 'root';
        if (!contents[folderKey]) {
          contents[folderKey] = { name: parentName, images: [] };
        }
        contents[folderKey].images.push({ id: key, ...value });
      }
    });

    return { treeNodes, contents };
  };

  const onSelect = (selectedKeys: React.Key[]) => {
    const key = selectedKeys[0] as string;
    const ref = folderRefs.current[key];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Layout className="min-h-screen">
      <Sider
        width={300}
        theme="light"
        className="top-0 bottom-0 left-0 fixed overflow-auto"
        style={{ height: '100vh', overflowY: 'auto' }}
      >
        <Title level={3} className="p-4">
          File Explorer
        </Title>
        <Tree showIcon defaultExpandAll onSelect={onSelect} treeData={treeData} />
      </Sider>
      <Layout className="ml-[300px]">
        <Content className="p-8">
          {Object.entries(folderContents).map(([folderKey, folder]) => (
            <div key={folderKey} ref={(folderRefs.current[folderKey] = React.createRef())}>
              <Title level={4}>{folder.name}</Title>
              <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {folder.images.map((img) => (
                  <CustomImage key={img.id} img={img} />
                ))}
              </div>
            </div>
          ))}
        </Content>
      </Layout>
    </Layout>
  );
};

export default FileExplorer;

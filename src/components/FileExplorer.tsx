import React, { useState, useEffect, useRef } from 'react';
import { Tree, Layout, Typography } from 'antd';
import { FolderOutlined } from '@ant-design/icons';
import { CustomImage } from './CustomImage';
import { Img } from '../types/img';
import client from '../api/client';

const { Content, Sider } = Layout;
const { Title } = Typography;

interface TreeNode {
  title: string;
  key: string;
  icon: React.ReactNode;
  children?: TreeNode[];
}

interface Folder {
  _id: string;
  name: string;
  parentId: string | null;
  path: string;
}

interface File extends Img {
  _id: string;
  folderId: string;
  path: string;
}

const FileExplorer: React.FC = () => {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [folderContents, setFolderContents] = useState<Record<string, File[]>>({});
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const folderRefs = useRef<Record<string, React.RefObject<HTMLDivElement>>>({});

  useEffect(() => {
    fetchFolders();
  }, []);

  useEffect(() => {
    if (selectedFolder && folderContents[selectedFolder]) {
      scrollToFolder(selectedFolder);
    }
  }, [selectedFolder, folderContents]);

  const fetchFolders = async () => {
    try {
      const response = await client.get<Folder[]>('/folders');
      const folders = response.data;
      const treeNodes = buildTreeData(folders);
      setTreeData(treeNodes);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const buildTreeData = (folders: Folder[]): TreeNode[] => {
    const folderMap: Record<string, TreeNode> = {};
    const rootNodes: TreeNode[] = [];

    folders.forEach((folder) => {
      const node: TreeNode = {
        title: folder.name,
        key: folder._id,
        icon: <FolderOutlined />,
        children: [],
      };
      folderMap[folder._id] = node;

      if (folder.parentId) {
        const parent = folderMap[folder.parentId];
        if (parent) {
          parent.children!.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    });

    return rootNodes;
  };

  const fetchFiles = async (folderId: string) => {
    if (!folderContents[folderId]) {
      try {
        const response = await client.get<File[]>(`/files/folder/${folderId}`);
        const files = response.data;
        setFolderContents((prev) => ({ ...prev, [folderId]: files }));
      } catch (error) {
        console.error('Error fetching files:', error);
      }
    }
  };

  const onSelect = async (selectedKeys: React.Key[]) => {
    const key = selectedKeys[0] as string;
    setSelectedFolder(key);
    await fetchFiles(key);
  };

  const scrollToFolder = (folderId: string) => {
    const ref = folderRefs.current[folderId];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
          {Object.entries(folderContents).map(([folderId, files]) => (
            <div key={folderId} ref={(el) => (folderRefs.current[folderId] = { current: el })} className="mb-8">
              <Title level={4}>{files[0]?.path.split('/').slice(-2, -1)[0]}</Title>
              <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {files.map((file) => (
                  <CustomImage key={file._id} img={file} />
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

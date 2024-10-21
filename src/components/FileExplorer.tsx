import React, { useState, useEffect, useRef } from 'react';
import { Tree, Layout, Typography, Button, Drawer, Spin, Skeleton } from 'antd';
import { FolderOutlined, MenuOutlined } from '@ant-design/icons';
import { Img } from '../types/img';
import client from '../api/client';
import { useMediaQuery } from 'react-responsive';
import Gallery from './Gallery';

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

  const [drawerVisible, setDrawerVisible] = useState(false);
  const isMobile = useMediaQuery({ query: '(max-width: 768px)' });

  const [loading, setLoading] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);

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
      setLoading(true);
      const response = await client.get<Folder[]>('/folders');
      const folders = response.data;
      const treeNodes = buildTreeData(folders);
      setTreeData(treeNodes);

      // Automatically select the first children folder of folders
      if (treeNodes.length > 0 && treeNodes[0].children) {
        const firstChild = treeNodes[0].children[0];
        setSelectedFolder(firstChild.key);
        fetchFiles(firstChild.key);
      }
    } catch (error) {
      console.error('Error fetching folders:', error);
    } finally {
      setLoading(false);
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
        setLoadingFiles(true);
        const response = await client.get<File[]>(`/files/folder/${folderId}`);
        const files = response.data;
        setFolderContents((prev) => ({ ...prev, [folderId]: files }));
      } catch (error) {
        console.error('Error fetching files:', error);
      } finally {
        setLoadingFiles(false);
      }
    }
  };

  const onSelect = async (selectedKeys: React.Key[]) => {
    const key = selectedKeys[0] as string;
    setSelectedFolder(key);
    await fetchFiles(key);
    if (isMobile) {
      setDrawerVisible(false);
    }
  };

  const scrollToFolder = (folderId: string) => {
    const ref = folderRefs.current[folderId];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const renderSidebarContent = () => (
    <Spin spinning={loading}>
      <Tree showIcon defaultExpandAll onSelect={onSelect} treeData={treeData} />
    </Spin>
  );

  return (
    <Layout className="min-h-screen">
      {isMobile ? (
        <Button
          type="primary"
          onClick={() => setDrawerVisible(true)}
          icon={<MenuOutlined />}
          className="top-4 left-4 fixed"
        />
      ) : (
        <Sider width={300} theme="light" className="top-0 bottom-0 left-0 fixed overflow-y-auto">
          <Title level={3} className="p-4">
            File Explorer
          </Title>
          {renderSidebarContent()}
        </Sider>
      )}
      <Layout className={isMobile ? 'ml-0' : 'ml-[300px]'}>
        <Content className="p-8">
          {loadingFiles ? (
            <div className="gap-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 mx-auto">
              {[...Array(10)].map((_, index) => (
                <Skeleton.Image key={index} active={true} />
              ))}
            </div>
          ) : (
            Object.entries(folderContents).map(([folderId, files]) => (
              <div key={folderId} ref={(el) => (folderRefs.current[folderId] = { current: el })} className="mb-8">
                <Title level={4}>{files[0]?.path.split('/').slice(-2, -1)[0]}</Title>
                <Gallery images={files} />
              </div>
            ))
          )}
        </Content>
      </Layout>
      <Drawer
        title="File Explorer"
        placement="left"
        closable={false}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={300}
      >
        {renderSidebarContent()}
      </Drawer>
    </Layout>
  );
};

export default FileExplorer;

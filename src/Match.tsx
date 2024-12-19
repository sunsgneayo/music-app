import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    Avatar,
    ListItemText,
    Drawer
} from '@mui/material';
import App from './App.tsx';

function Match() {
    const [listShow, setListShow] = useState(false);
    const [selectedSong, setSelectedSong] = useState(null);
    const [songList, setSongList] = useState(null);

    const onMusicListShow = (state) => {
        setListShow(state);
    };

    // 处理歌曲点击事件
    const handleSongClick = (song) => {
        song.play = true;
        setSelectedSong(song);
        // 在这里可以进行其他处理，比如播放选中的歌曲
    };

    // 随机播放下一曲
    const onNextMusic = () => {
        if (!songList) return;
        const count = songList.length - 1;
        const song = songList[getRandomNumber(0, count)];
        handleSongClick(song);
    };

    // 获取随机数
    const getRandomNumber = (min, max) => {
        return Math.floor(Math.random() * (max - min + 1) + min);
    };

    // 异步函数来获取歌曲列表
    const fetchSongList = async () => {
        try {
            const response = await fetch('/song.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setSongList(data);
            setSelectedSong(data[1] || null); // 设置默认歌曲
        } catch (error) {
            console.error('Fetching song list failed:', error);
        }
    };

    // 在组件挂载时获取歌曲列表
    useEffect(() => {
        fetchSongList();
    }, []);

    if (!songList) return <div>Loading...</div>; // 加载中状态

    return (
        <>
            <App
                onMusicListShow={onMusicListShow}
                musicListShow={listShow}
                selectedSong={selectedSong}
                onNextMusic={onNextMusic}
            />

            <Drawer
                anchor='right'
                open={listShow}
                onClose={() => setListShow(false)}
                PaperProps={{
                    style: {
                        backgroundColor: 'transparent',
                    },
                }}
            >
                <Box role="presentation" sx={{
                    width: 'auto',
                    background: 'rgba(0,0,0,0.3)',
                    zIndex: 1
                }}>
                    <List>
                        {songList.map((item, index) => (
                            <ListItem
                                key={index}
                                disablePadding
                            >
                                <ListItemButton onClick={() => handleSongClick(item)}>
                                    <ListItemIcon>
                                        <Avatar alt={item.artists} src={item.avatar} />
                                    </ListItemIcon>
                                    <ListItemText secondary={
                                        <Typography sx={{ display: 'inline', color: '#fff' }} variant="body1">
                                            {item.name} -- {item.artists}
                                        </Typography>
                                    } />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Drawer>
        </>
    );
}

export default Match;
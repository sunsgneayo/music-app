import React, {useState} from 'react';
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
import App from './App.tsx'
import songList from "../public/song.json";

function Match() {


    const [listShow, setListShow] = useState(false);
    const onMusicListShow = (state: boolean) => {
        setListShow(state)
    }
    const [selectedSong, setSelectedSong] = useState(songList[1]);
    // 处理歌曲点击事件
    const handleSongClick = (song) => {
        song.play = true;
        setSelectedSong(song);
        // 在这里可以进行其他处理，比如播放选中的歌曲
    }
    // 随机播放下一曲
    const onNextMusic = () =>{
        const count = songList.length - 1
        const song = songList[getRandomNumber(0 , count)]
        handleSongClick(song)
    }

    // 获取随机数
    const getRandomNumber = (min: number, max: number) => {
        return Math.floor(Math.random() * (max - min + 1) + min);
    };

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
                onClose={() => {
                    setListShow(false)
                }}
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
                                        <Avatar alt={item.artists} src={item.avatar}/>
                                    </ListItemIcon>
                                    <ListItemText secondary={
                                        <Typography sx={{display: 'inline', color: '#fff'}} variant="body1">
                                            {item.name} -- {item.artists}
                                        </Typography>
                                    }/>
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Drawer>
        </>
    )
}

export default Match

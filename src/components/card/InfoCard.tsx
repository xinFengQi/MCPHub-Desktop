import { Tag } from "@/components/Tag"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from 'framer-motion'
import { Settings, Play, Pause } from 'lucide-react'
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"


export type InstallStaus = 'uninstall' | 'installing' | 'update' | 'latestVersion';

export interface InfoCardProps {
    id: string
    title: string
    description: string
    creator: string
    logoUrl: string
    tags: string[]
    env: Record<string, string>
    guide: string,
    installStaus: InstallStaus,
    isStart: boolean,
    isChecking: boolean
}

// 状态映射
const statusMap: Record<string, string> = {
    uninstall: '未安装',
    installing: '安装中',
    update: '可更新',
    latestVersion: '最新版本',
}

export function InfoCard(props: InfoCardProps & {
    installClick: () => void,
    startClick: () => void,
    stopClick: () => void
}) {
    const {
        title,
        description,
        creator,
        logoUrl,
        tags,
        installStaus,
        isChecking,
        installClick,
        startClick,
        isStart,
        stopClick
    } = props

    // 点击处理
    function handleStatusClick() {
        console.log(`点击了状态: ${installStaus}, 标题: ${title}, isChecking: ${isChecking}`)
        if (isChecking) return
        if (installStaus === 'uninstall')
            installClick()
    }

    const clickable = installStaus === 'uninstall' || installStaus === 'update'

    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
        >
            <Card className="w-full max-w-sm overflow-hidden bg-gradient-to-br from-white to-gray-100 dark:from-gray-800 dark:to-gray-900 shadow-lg">
                <CardContent className="p-4">
                    <div className="flex items-center space-x-3 mb-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={logoUrl} alt={title} />
                            <AvatarFallback>{title[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="font-semibold text-base leading-none mb-1 flex items-center gap-2">
                                {title}
                                {isChecking ? (
                                    <div className="animate-spin h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                ) : (<Badge
                                    className={
                                        `ml-2 px-2 py-0.5 text-xs font-normal rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 border-none ${clickable ? 'cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800 transition' : ''}`
                                    }
                                    variant="secondary"
                                    {...(clickable ? { onClick: handleStatusClick } : {})}
                                >
                                    {statusMap[installStaus] || installStaus}
                                </Badge>)}
                            </h3>
                            <p className="text-sm text-muted-foreground">{creator}</p>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-5">{description}</p>
                    <div className="flex flex-wrap gap-1 mb-3 h-12 overflow-y-auto">
                        {tags.map((tag, index) => (
                            <Tag key={index} name={tag} />
                        ))}
                    </div>
                    <div className="flex gap-2 w-full">
                        <Button className="flex-1 flex items-center justify-center gap-2" variant='outline'>
                            <Settings className="w-4 h-4" />
                            配置
                        </Button>
                        {
                            isStart ? (
                                <Button className="flex-1 flex items-center justify-center gap-2" variant='default' onClick={stopClick}>
                                    <Pause className="w-4 h-4" />
                                    停止
                                </Button>
                            ) : (
                                <Button className="flex-1 flex items-center justify-center gap-2" variant='default' onClick={startClick}>
                                    <Play className="w-4 h-4" />
                                    启动
                                </Button>
                            )
                        }
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
import React from 'react';
import { motion } from 'framer-motion';

interface RiddleStatsBannerProps {
    totalRiddles: number;
    totalSubjects: number;
    perRiddleTime?: string;
    className?: string;
}

export const RiddleStatsBanner: React.FC<RiddleStatsBannerProps> = ({
    totalRiddles,
    totalSubjects,
    perRiddleTime = "30s",
    className = ""
}) => {
    const stats = [
        { label: "Total Riddles", value: totalRiddles, icon: "🧩" },
        { label: "Subjects", value: totalSubjects, icon: "📚" },
        { label: "Per Riddle", value: perRiddleTime, icon: "⏱️" },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`mb-10 grid grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}
        >
            {stats.map((stat, index) => (
                <motion.div
                    key={index}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    className="group relative overflow-hidden rounded-[2rem] bg-white p-8 text-center shadow-soft transition-all hover:shadow-xl hover:bg-gray-50/50"
                >
                    {/* Subtle background glow on hover */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/0 via-purple-500/0 to-pink-500/0 opacity-0 transition-opacity group-hover:opacity-10 group-hover:from-indigo-500 group-hover:via-purple-500 group-hover:to-pink-500" />

                    <div className="relative z-10">
                        <div className="mb-4 flex justify-center">
                            <span className="text-4xl filter drop-shadow-sm group-hover:scale-110 transition-transform duration-300" role="img" aria-label={stat.label}>
                                {stat.icon}
                            </span>
                        </div>
                        <p className="text-3xl font-extrabold text-gray-800 tracking-tight mb-1">
                            {stat.value}
                        </p>
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                            {stat.label}
                        </p>
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
};

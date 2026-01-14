/**
 * Water Wobble Filter
 * SVG filter for water bubble effect
 * 
 * @module components/stories/WaterWobble
 */

import { memo } from 'react'

/**
 * SVG filter definition for water wobble effect
 * Include this once in your app, then reference via filter: url(#water-wobble)
 */
export const WaterWobbleFilter = memo(function WaterWobbleFilter() {
    return (
        <svg
            width="0"
            height="0"
            style={{ position: 'absolute', visibility: 'hidden' }}
            aria-hidden="true"
        >
            <defs>
                <filter id="water-wobble" x="-20%" y="-20%" width="140%" height="140%">
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.015"
                        numOctaves="2"
                        result="noise"
                    >
                        <animate
                            attributeName="baseFrequency"
                            values="0.015;0.02;0.015"
                            dur="4s"
                            repeatCount="indefinite"
                        />
                    </feTurbulence>
                    <feDisplacementMap
                        in="SourceGraphic"
                        in2="noise"
                        scale="3"
                        xChannelSelector="R"
                        yChannelSelector="G"
                    />
                </filter>
            </defs>
        </svg>
    )
})

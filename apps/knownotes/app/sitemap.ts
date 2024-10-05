import { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { absoluteUrl } from "@/lib/utils";
import { allColleges, allPosts } from "contentlayer/generated";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = allPosts
    .filter((post) => post.published)
    .map((post) => {
      return {
        url: absoluteUrl(post.slug),
        lastModified: new Date(post.date),
      };
    });
  const colleges = allColleges.map((college) => {
    return {
      url: absoluteUrl(college.slug),
      lastModified: new Date(),
    };
  });

  return [
    {
      url: `${siteConfig.url}/`,
      lastModified: new Date(),
    },
    {
      url: `${siteConfig.url}/login`,
      lastModified: new Date(),
    },
    {
      url: `${siteConfig.url}/register`,
      lastModified: new Date(),
    },
    // {
    //   url: `${siteConfig.url}/pricing`,
    //   lastModified: new Date(),
    // },
    {
      url: `${siteConfig.url}/about`,
      lastModified: new Date(),
    },
    {
      url: `${siteConfig.url}/privacy`,
      lastModified: new Date(),
    },
    {
      url: `${siteConfig.url}/terms`,
      lastModified: new Date(),
    },
  ]
    .concat(posts)
    .concat(colleges);
}

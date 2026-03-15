// BACKUP: Original Featured Guides Section from Index.tsx
// Saved on 2026-03-14 before redesign

/*
{/* 7. Featured Guides Section */}
<section className="py-16 bg-background">
  <div className="container">
    <div className="flex items-center justify-between mb-8">
      <div>
        <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-sm font-medium text-primary mb-4">Expert Content</span>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          Featured <span className="text-primary">Guides</span>
        </h2>
        <p className="text-muted-foreground">Expert-written guides to help you navigate technology.</p>
      </div>
      <Button variant="outline" asChild className="hidden md:inline-flex rounded-xl">
        <Link to="/guides" className="flex items-center gap-2">
          View All Guides
          <ArrowRight className="w-4 h-4" />
        </Link>
      </Button>
    </div>
    {loadingGuides ? (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-xl border border-border overflow-hidden animate-pulse">
            <div className="aspect-video bg-muted" />
            <div className="p-5">
              <div className="h-5 bg-muted rounded w-1/4 mb-3" />
              <div className="h-6 bg-muted rounded w-full mb-2" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    ) : featuredGuides.length > 0 ? (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuredGuides.map((guide, index) => (
          <AnimatedCard key={guide.id} delay={index * 150} animation="fade-up">
            <Link
              to={`/blog/${guide.slug}`}
              className="block group bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-300 h-full"
            >
              <div className="aspect-video overflow-hidden">
                {guide.cover_image ? (
                  <img
                    src={guide.cover_image}
                    alt={guide.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <div className="p-5">
                <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
                  {categoryLabels[guide.category] || guide.category}
                </span>
                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {guide.title}
                </h3>
                <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{guide.excerpt}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {guide.read_time_minutes || 5} min read
                </div>
              </div>
            </Link>
          </AnimatedCard>
        ))}
      </div>
    ) : (
      <div className="text-center py-12">
        <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No featured guides yet</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          Featured guides will appear here once you mark them as featured in the admin panel.
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link to="/guides">Browse All Guides</Link>
        </Button>
      </div>
    )}
    <div className="mt-8 text-center md:hidden">
      <Button variant="outline" asChild className="rounded-xl">
        <Link to="/guides" className="flex items-center gap-2">
          View All Guides
          <ArrowRight className="w-4 h-4" />
        </Link>
      </Button>
    </div>
  </div>
</section>
*/

export {};

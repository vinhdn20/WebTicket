using Microsoft.EntityFrameworkCore;
using Repositories.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace Repositories
{
    public class WebTicketDbContext : DbContext
    {
        public WebTicketDbContext(DbContextOptions<WebTicketDbContext> options) : base(options)
        {

        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
            base.OnModelCreating(modelBuilder);
        }

        public DbSet<Card> Cards { get; set; }
        public DbSet<AGCustomer> AgCustomers { get; set; }
        public DbSet<Customer> Customers { get; set; }
        public DbSet<ThongTinVe> ThongTinVes { get; set; }
        public DbSet<Users> Users { get; set; }
        public DbSet<UserTokens> UserTokens { get; set; }
        public DbSet<VeDetail> VeDetails { get; set; }
    }
}
